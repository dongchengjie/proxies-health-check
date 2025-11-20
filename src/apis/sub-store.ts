import axios from "axios";

const SUB_STORE_PORT = process.env.SUB_STORE_BACKEND_API_PORT || 3000;

export const setSettings = (settings: Record<string, any>) => {
  return axios.request({
    url: `http://127.0.0.1:${SUB_STORE_PORT}/api/settings`,
    method: "patch",
    data: settings,
    timeout: 3 * 1000,
  });
};

export const addSub = (sub: string, url: string) => {
  return axios.request({
    url: `http://127.0.0.1:${SUB_STORE_PORT}/api/subs`,
    method: "post",
    data: {
      name: sub,
      displayName: "",
      form: "",
      remark: "",
      mergeSources: "",
      ignoreFailedRemoteSub: false,
      passThroughUA: false,
      icon: "",
      isIconColor: true,
      process: [
        {
          type: "Quick Setting Operator",
          args: {
            useless: "DISABLED",
            udp: "DEFAULT",
            scert: "DEFAULT",
            tfo: "DEFAULT",
            "vmess aead": "DEFAULT",
          },
        },
      ],
      tag: [],
      subscriptionTags: [],
      source: "remote",
      url,
      content: "",
      ua: "clash.meta",
      subscriptions: [],
      "display-name": "",
    },
    timeout: 10 * 1000,
  });
};

export const addCollection = (collection: string, subscriptions: string[]) => {
  return axios.request({
    url: `http://127.0.0.1:${SUB_STORE_PORT}/api/collections`,
    method: "post",
    data: {
      name: collection,
      displayName: "",
      form: "",
      remark: "",
      mergeSources: "",
      ignoreFailedRemoteSub: "enabled",
      passThroughUA: false,
      icon: "",
      isIconColor: true,
      process: [
        {
          type: "Quick Setting Operator",
          args: {
            useless: "ENABLED",
            udp: "DEFAULT",
            scert: "DEFAULT",
            tfo: "DEFAULT",
            "vmess aead": "DEFAULT",
          },
        },
        {
          type: "Type Filter",
          args: {
            keep: true,
            value: [
              "ss",
              "ssr",
              "vless",
              "vmess",
              "trojan",
              "http",
              "snell",
              "socks5",
              "tuic",
              "hysteria2",
              "hysteria",
              "mieru",
              "wireguard",
              "direct",
              "ssh",
              "anytls",
            ],
          },
          customName: "协议过滤",
          id: "1111111.111111111",
          disabled: false,
        },
        {
          type: "Script Filter",
          args: {
            content:
              "function filter(proxies, targetPlatform) {\n  const identifiers = [];\n  return proxies.map((proxy) => {\n    const identifier = `${proxy.type}-${proxy.server}-${proxy.port}`;\n    if (identifiers.includes(identifier)) return false;\n    identifiers.push(identifier);\n    return true;\n  });\n}\n",
            mode: "script",
            arguments: {},
          },
          customName: "节点去重",
          id: "2222222.222222222",
          disabled: false,
        },
        {
          type: "Handle Duplicate Operator",
          args: {
            action: "rename",
            position: "back",
            template: "0 1 2 3 4 5 6 7 8 9",
            link: "-",
          },
          customName: "节点后缀",
          id: "3333333.333333333",
          disabled: false,
        },
      ],
      subscriptions,
      tag: [],
      subscriptionTags: [],
      "display-name": "",
    },
    timeout: 10 * 1000,
  });
};

export const downloadCollection = async (
  collection: string,
  target: string = "ClashMeta"
) => {
  const response = await axios.request({
    url: `http://127.0.0.1:${SUB_STORE_PORT}/download/collection/${collection}?target=${target}`,
    method: "get",
    timeout: 20 * 60 * 1000,
  });
  return response.data;
};
