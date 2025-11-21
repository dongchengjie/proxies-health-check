/**
 * Utility functions for proxy operations
 */

import type { Proxy, ProxyWithMetadata, ExcludedProxy } from "../types/proxy";

const EXCLUDED_TIMES_KEY = "_excluded_times";

/**
 * Generate a unique key for a proxy based on its type, server, and port
 */
export function getProxyKey(proxy: Proxy): string {
  return `${proxy.type}-${proxy.server}-${proxy.port}`;
}

/**
 * Simplify a proxy to include only essential fields for exclusion tracking
 */
export function simplifyProxy(proxy: ProxyWithMetadata): ExcludedProxy {
  return {
    type: proxy.type,
    server: proxy.server,
    port: proxy.port,
    [EXCLUDED_TIMES_KEY]: proxy[EXCLUDED_TIMES_KEY] || 0,
  };
}

/**
 * Get the exclusion times for a proxy
 */
export function getExclusionTimes(proxy: ProxyWithMetadata): number {
  return proxy[EXCLUDED_TIMES_KEY] || 0;
}

/**
 * Set the exclusion times for a proxy
 */
export function setExclusionTimes(proxy: ProxyWithMetadata, times: number): void {
  proxy[EXCLUDED_TIMES_KEY] = times;
}

/**
 * Remove exclusion metadata from a proxy
 */
export function clearExclusionTimes(proxy: ProxyWithMetadata): void {
  delete proxy[EXCLUDED_TIMES_KEY];
}

/**
 * Increment the exclusion times for a proxy
 */
export function incrementExclusionTimes(proxy: ProxyWithMetadata): void {
  proxy[EXCLUDED_TIMES_KEY] = (proxy[EXCLUDED_TIMES_KEY] || 0) + 1;
}
