/**
 * Clash Meta configuration template
 */

import type { Proxy } from "../types/proxy";

export function createClashMetaConfig(proxies: Proxy[]) {
  return {
    "mixed-port": 7890,
    ipv6: true,
    "allow-lan": true,
    "unified-delay": false,
    "tcp-concurrent": true,
    "external-controller": "127.0.0.1:9090",
    "geox-url": {
      geoip:
        "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geoip.dat",
      geosite:
        "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite.dat",
      mmdb: "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geoip.metadb",
      asn: "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/GeoLite2-ASN.mmdb",
    },
    dns: {
      enable: true,
      listen: "0.0.0.0:1053",
      ipv6: true,
      "use-system-hosts": false,
      "enhanced-mode": "fake-ip",
      "fake-ip-range": "198.18.0.1/16",
      "fake-ip-filter": ["+.lan", "+.local", "+.msftconnecttest.com", "+.msftncsi.com"],
      "default-nameserver": ["223.5.5.5", "119.29.29.29", "1.1.1.1", "8.8.8.8"],
      nameserver: [
        "https://dns.alidns.com/dns-query",
        "https://doh.pub/dns-query",
        "https://doh.360.cn/dns-query",
        "https://1.1.1.1/dns-query",
        "https://1.0.0.1/dns-query",
        "https://208.67.222.222/dns-query",
        "https://208.67.220.220/dns-query",
        "https://194.242.2.2/dns-query",
        "https://194.242.2.3/dns-query",
      ],
      "proxy-server-nameserver": [
        "https://dns.alidns.com/dns-query",
        "https://doh.pub/dns-query",
        "https://doh.360.cn/dns-query",
        "https://1.1.1.1/dns-query",
        "https://1.0.0.1/dns-query",
        "https://208.67.222.222/dns-query",
        "https://208.67.220.220/dns-query",
        "https://194.242.2.2/dns-query",
        "https://194.242.2.3/dns-query",
      ],
      "nameserver-policy": {
        "geosite:private,cn,geolocation-cn": [
          "https://dns.alidns.com/dns-query",
          "https://doh.pub/dns-query",
          "https://doh.360.cn/dns-query",
        ],
        "geosite:google,youtube,telegram,gfw,geolocation-!cn": [
          "https://1.1.1.1/dns-query",
          "https://1.0.0.1/dns-query",
          "https://208.67.222.222/dns-query",
          "https://208.67.220.220/dns-query",
          "https://194.242.2.2/dns-query",
          "https://194.242.2.3/dns-query",
        ],
      },
    },
    "proxy-groups": [
      {
        name: "🚀 节点选择",
        type: "select",
        proxies: ["♻️ 自动选择", "🚑 故障转移", "⚖️ 负载均衡", "DIRECT"],
        "include-all-proxies": true,
      },
      {
        name: "♻️ 自动选择",
        type: "url-test",
        url: "https://www.gstatic.com/generate_204",
        "include-all-proxies": true,
      },
      {
        name: "🚑 故障转移",
        type: "fallback",
        url: "https://www.gstatic.com/generate_204",
        "include-all-proxies": true,
      },
      {
        name: "⚖️ 负载均衡",
        type: "load-balance",
        strategy: "round-robin",
        url: "https://www.gstatic.com/generate_204",
        "include-all-proxies": true,
      },
      {
        name: "🎯 全球直连",
        type: "select",
        proxies: [
          "DIRECT",
          "🚀 节点选择",
          "♻️ 自动选择",
          "🚑 故障转移",
          "⚖️ 负载均衡",
        ],
      },
      {
        name: "🐟 漏网之鱼",
        type: "select",
        proxies: [
          "🚀 节点选择",
          "♻️ 自动选择",
          "🚑 故障转移",
          "⚖️ 负载均衡",
          "DIRECT",
        ],
        "include-all-proxies": true,
      },
    ],
    proxies,
    rules: [
      "GEOIP,lan,🎯 全球直连,no-resolve",
      "GEOSITE,github,🚀 节点选择",
      "GEOSITE,twitter,🚀 节点选择",
      "GEOSITE,youtube,🚀 节点选择",
      "GEOSITE,google,🚀 节点选择",
      "GEOSITE,telegram,🚀 节点选择",
      "GEOSITE,netflix,🚀 节点选择",
      "GEOSITE,bilibili,🎯 全球直连",
      "GEOSITE,bahamut,🚀 节点选择",
      "GEOSITE,spotify,🚀 节点选择",
      "GEOSITE,CN,🎯 全球直连",
      "GEOSITE,geolocation-!cn,🐟 漏网之鱼",
      "GEOIP,google,🚀 节点选择",
      "GEOIP,netflix,🚀 节点选择",
      "GEOIP,telegram,🚀 节点选择",
      "GEOIP,twitter,🚀 节点选择",
      "GEOIP,CN,🎯 全球直连",
      "MATCH,🐟 漏网之鱼",
    ],
  };
}
