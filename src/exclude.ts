import { inputs } from "./actions/input";
import { uniqueKey } from "./health-check";
import { downloadSubscriptionCollection } from "./subscription";

const EXCLUDED_TIMES_KEY = "_excluded_times";

export const getExcludedProxies = async () => {
  try {
    const urls = inputs["excluded_proxies_config_urls"].filter(Boolean);
    if (urls.length === 0) return [];

    return await downloadSubscriptionCollection(urls, "JSON");
  } catch {
    return [];
  }
};

export const shouldExcludeProxy = (proxy: any, excluded: any[] = []) => {
  const times = inputs["max_excluded_times"];
  if (proxy[EXCLUDED_TIMES_KEY] && proxy[EXCLUDED_TIMES_KEY] >= times) {
    return true;
  }

  return excluded.find((item) => uniqueKey(item) === uniqueKey(proxy))
    ? true
    : false;
};

export const markProxyAsNotExcluded = (proxy: any) => {
  if (proxy[EXCLUDED_TIMES_KEY]) delete proxy[EXCLUDED_TIMES_KEY];
};

export const markProxyAsExcluded = (proxy: any, excluded: any[] = []) => {
  if (!excluded.find((item) => uniqueKey(item) === uniqueKey(proxy))) {
    excluded.push(proxy);
  }
  proxy[EXCLUDED_TIMES_KEY] = (proxy[EXCLUDED_TIMES_KEY] || 0) + 1;
};
