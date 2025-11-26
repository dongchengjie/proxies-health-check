import { inputs } from "./actions/input";
import { uniqueKey } from "./health-check";
import { downloadSubscriptionCollection } from "./subscription";

const EXCLUDED_TIMES_KEY = "_excluded_times";

const simplify = (proxy: any) => {
  return {
    type: proxy.type,
    server: proxy.server,
    port: proxy.port,
    [EXCLUDED_TIMES_KEY]: proxy[EXCLUDED_TIMES_KEY],
  };
};

export const getExcludedProxies = async () => {
  try {
    const urls = inputs["excluded_proxies_config_urls"].filter(Boolean);
    if (urls.length === 0) return [];

    const excludedProxies = await downloadSubscriptionCollection(urls, "JSON");
    return excludedProxies.map((proxy: any) => ({
      ...simplify(proxy),
      [EXCLUDED_TIMES_KEY]: proxy[EXCLUDED_TIMES_KEY] ?? 1,
    }));
  } catch {
    return [];
  }
};

export const shouldExcludeProxy = (proxy: any, excluded: any[] = []) => {
  const key = uniqueKey(proxy);
  const maxExcludedTimes = inputs["max_excluded_times"];
  return excluded.find(
    (item) =>
      uniqueKey(item) === key && item[EXCLUDED_TIMES_KEY] >= maxExcludedTimes
  )
    ? true
    : false;
};

export const markProxyAsNotExcluded = (proxy: any, excluded: any[] = []) => {
  const key = uniqueKey(proxy);
  const idx = excluded.findIndex((item) => uniqueKey(item) === key);
  if (idx !== -1) {
    excluded.splice(idx, 1);
  }
};

export const markProxyAsExcluded = (proxy: any, excluded: any[] = []) => {
  const key = uniqueKey(proxy);
  const result = excluded.find((item) => uniqueKey(item) === key);
  if (result) {
    result[EXCLUDED_TIMES_KEY] = (result[EXCLUDED_TIMES_KEY] || 0) + 1;
  } else {
    excluded.push({
      ...simplify(proxy),
      [EXCLUDED_TIMES_KEY]: proxy[EXCLUDED_TIMES_KEY] ?? 1,
    });
  }
};
