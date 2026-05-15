import { inputs } from "./actions/input";
import path from "path";
import { stringify } from "yaml";
import * as core from "@actions/core";
import fs from "fs-extra";

const workspace = process.env["GITHUB_WORKSPACE"] ? "/github/workspace" : "";
const defaultGroupKey = "__default_group_key__";

const sortQualifiedProxies = (qualifiedProxies: any[]) => {
  const { priority_keywords: keywords, priority_types: types } = inputs;

  // Sort into groups by keywords
  const groups: Record<string, any[]> = {};
  if (keywords.length > 0) {
    keywords.forEach(keyword => {
      groups[keyword] = [];
    });
    for (const proxy of qualifiedProxies) {
      const key = keywords.find(keyword => proxy.name.includes(keyword));
      (groups[key || defaultGroupKey] ??= []).push(proxy);
    }
  } else {
    groups[defaultGroupKey] = qualifiedProxies;
  }

  // Sort within groups by type priority
  for (const group of Object.values(groups)) {
    group.sort((a, b) => {
      const ai = types.findIndex(t => a.type === t);
      const bi = types.findIndex(t => b.type === t);
      if (ai === -1) return bi === -1 ? 0 : 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }

  // Flatten groups, with ungrouped proxies at the end
  const { [defaultGroupKey]: defaultGroup = [], ...rest } = groups;
  const sorted = [...Object.values(rest).flat(), ...defaultGroup];

  // Add suffix to duplicate proxy names
  const countMap = new Map<string, number>();
  return sorted.map(p => {
    const cnt = countMap.get(p.name) || 0;
    countMap.set(p.name, cnt + 1);
    return cnt ? { ...p, name: `${p.name}-${cnt}` } : p;
  });
};

export const outputQualifiedProxies = (qualifiedProxies: any[]) => {
  // Output qualified proxies to YAML file
  const qualifiedFile = path.resolve(workspace, inputs["qualified"]);
  outputProxies(qualifiedProxies, qualifiedFile);
  core.info(`✅ Output ${qualifiedProxies.length} qualified proxies.`);

  // If split_by_protocol is enabled, also output proxies grouped by protocol
  if (inputs["split_by_protocol"]) {
    const protocols = qualifiedProxies.reduce((acc: Record<string, any[]>, proxy) => {
      if (typeof proxy.type === "string") (acc[proxy.type] ??= []).push(proxy);
      return acc;
    }, {});
    for (const [protocol, proxies] of Object.entries(protocols)) {
      const { dir, name, ext } = path.parse(qualifiedFile);
      const outputFile = path.resolve(dir, `${name}_${protocol}${ext}`);
      outputProxies(proxies, outputFile);
      core.info(`✅ Output ${proxies.length} qualified ${protocol} proxies.`);
    }
  }
};

const outputProxies = (proxies: any[], outputFile: string) => {
  if (!Array.isArray(proxies) || proxies.length === 0) return;

  // Sort proxies by priority keywords and types
  proxies = sortQualifiedProxies(proxies);

  const proxyNames = proxies.map(proxy => proxy.name);
  const yaml = stringify({
    "mixed-port": 7890,
    ipv6: true,
    "allow-lan": true,
    "unified-delay": true,
    "tcp-concurrent": true,
    "external-controller": "127.0.0.1:9090",
    "geox-url": {
      geoip: "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geoip.dat",
      geosite: "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite.dat",
      mmdb: "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geoip.metadb",
      asn: "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/GeoLite2-ASN.mmdb"
    },
    dns: {
      enable: true,
      listen: "0.0.0.0:1053",
      ipv6: false,
      "use-system-hosts": false,
      "cache-algorithm": "arc",
      "enhanced-mode": "fake-ip",
      "fake-ip-range": "198.18.0.1/16",
      "fake-ip-filter": ["+.lan", "+.local", "+.msftconnecttest.com", "+.msftncsi.com"],
      "default-nameserver": ["223.5.5.5", "119.29.29.29", "1.1.1.1", "8.8.8.8"],
      nameserver: ["https://dns.alidns.com/dns-query", "https://doh.pub/dns-query"],
      "respect-rules": true,
      "proxy-server-nameserver": ["https://dns.alidns.com/dns-query", "https://doh.pub/dns-query"],
      "nameserver-policy": {
        "geosite:private,cn,geolocation-cn": [
          "https://dns.alidns.com/dns-query",
          "https://doh.pub/dns-query"
        ],
        "geosite:google,youtube,telegram,gfw,geolocation-!cn": [
          "https://1.1.1.1/dns-query",
          "https://1.0.0.1/dns-query",
          "https://208.67.222.222/dns-query",
          "https://208.67.220.220/dns-query"
        ]
      }
    },
    sniffer: {
      enable: true,
      sniff: {
        HTTP: { ports: [80, "8080-8880"], "override-destination": true },
        TLS: { ports: [443, 8443] },
        QUIC: { ports: [443, 8443] }
      },
      "skip-domain": ["Mijia Cloud", "+.push.apple.com"]
    },
    "proxy-groups": [
      {
        name: "🚀 节点选择",
        type: "select",
        proxies: ["♻️ 自动选择", "🚑 故障转移", "DIRECT", ...proxyNames]
      },
      {
        name: "♻️ 自动选择",
        type: "url-test",
        url: "https://cp.cloudflare.com/generate_204",
        lazy: true,
        interval: 180,
        timeout: 3000,
        tolerance: 200,
        "max-failed-times": 3,
        proxies: [...proxyNames]
      },
      {
        name: "🚑 故障转移",
        type: "fallback",
        url: "https://cp.cloudflare.com/generate_204",
        lazy: true,
        interval: 180,
        timeout: 3000,
        "max-failed-times": 3,
        proxies: [...proxyNames]
      },
      {
        name: "🎯 全局直连",
        type: "select",
        proxies: ["DIRECT", "🚀 节点选择", "♻️ 自动选择", "🚑 故障转移"]
      },
      {
        name: "🐟 漏网之鱼",
        type: "select",
        proxies: ["🚀 节点选择", "♻️ 自动选择", "🚑 故障转移", "DIRECT"]
      }
    ],
    proxies,
    rules: [
      "GEOIP,lan,🎯 全局直连,no-resolve",
      "GEOSITE,github,🚀 节点选择",
      "GEOSITE,twitter,🚀 节点选择",
      "GEOSITE,youtube,🚀 节点选择",
      "GEOSITE,google,🚀 节点选择",
      "GEOSITE,telegram,🚀 节点选择",
      "GEOSITE,netflix,🚀 节点选择",
      "GEOSITE,bilibili,🎯 全局直连",
      "GEOSITE,bahamut,🚀 节点选择",
      "GEOSITE,spotify,🚀 节点选择",
      "GEOSITE,CN,🎯 全局直连",
      "GEOSITE,geolocation-!cn,🐟 漏网之鱼",
      "GEOIP,google,🚀 节点选择",
      "GEOIP,netflix,🚀 节点选择",
      "GEOIP,telegram,🚀 节点选择",
      "GEOIP,twitter,🚀 节点选择",
      "GEOIP,CN,🎯 全局直连",
      "MATCH,🐟 漏网之鱼"
    ]
  });

  // Remove escape characters from the YAML string
  const cleanedYaml = yaml.replace(/\\u[\da-fA-F]{4}|\\x[\da-fA-F]{2}/g, "");

  fs.outputFileSync(outputFile, cleanedYaml);
};

export const outputExcludedProxies = (excludedProxies: any[]) => {
  if (excludedProxies.length > 0) {
    const excludedFile = path.resolve(workspace, inputs["excluded"]);
    fs.outputFileSync(excludedFile, stringify({ proxies: excludedProxies }));
    core.info(`✅ Output ${excludedProxies.length} excluded proxies.`);
  } else {
    core.warning("⚠️ No excluded proxies found.");
  }
};
