import { inputs } from "./actions/input";
import { uniqueKey } from "./health-check";
import { downloadSubscriptionCollection } from "./subscription";

const EXCLUDED_TIMES_KEY = "_excluded_times";

export const simplifyExcludedProxy = (proxy: any) => {
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
      ...simplifyExcludedProxy(proxy),
      [EXCLUDED_TIMES_KEY]: proxy[EXCLUDED_TIMES_KEY] ?? 1,
    }));
  } catch {
    return [];
  }
};

export const shouldExcludeProxy = (proxy: any, excluded: any[] = []) => {
  const times = inputs["max_excluded_times"];
  if (proxy[EXCLUDED_TIMES_KEY] && proxy[EXCLUDED_TIMES_KEY] >= times) {
    return true;
  }

  return excluded.find(
    (item) =>
      uniqueKey(item) === uniqueKey(proxy) && item[EXCLUDED_TIMES_KEY] >= times
  )
    ? true
    : false;
};

export const markProxyAsNotExcluded = (proxy: any, excluded: any[] = []) => {
  const idx = excluded.findIndex(
    (item) => uniqueKey(item) === uniqueKey(proxy)
  );
  if (idx !== -1) {
    excluded.splice(idx, 1);
  }
  delete proxy[EXCLUDED_TIMES_KEY];
};

export const markProxyAsExcluded = (proxy: any, excluded: any[] = []) => {
  if (!excluded.find((item) => uniqueKey(item) === uniqueKey(proxy))) {
    excluded.push(proxy);
  }
  proxy[EXCLUDED_TIMES_KEY] = (proxy[EXCLUDED_TIMES_KEY] ?? 0) + 1;
};
