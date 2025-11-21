/**
 * Exclusion service - manages proxy exclusion logic
 */

import type { Proxy, ProxyWithMetadata } from "../types/proxy";
import { 
  getProxyKey, 
  getExclusionTimes, 
  incrementExclusionTimes, 
  clearExclusionTimes 
} from "../utils/proxy-utils";

export class ExclusionService {
  private readonly maxExcludedTimes: number;
  private readonly excludedProxiesMap: Map<string, ProxyWithMetadata>;

  constructor(maxExcludedTimes: number, initialExcluded: ProxyWithMetadata[] = []) {
    this.maxExcludedTimes = maxExcludedTimes;
    this.excludedProxiesMap = new Map();
    
    // Initialize map with existing excluded proxies
    for (const proxy of initialExcluded) {
      this.excludedProxiesMap.set(getProxyKey(proxy), proxy);
    }
  }

  /**
   * Check if a proxy should be excluded from health checks
   */
  shouldExclude(proxy: ProxyWithMetadata): boolean {
    // Check if proxy itself has been excluded too many times
    if (getExclusionTimes(proxy) >= this.maxExcludedTimes) {
      return true;
    }

    // Check if proxy is in the excluded list with too many failures
    const key = getProxyKey(proxy);
    const excludedProxy = this.excludedProxiesMap.get(key);
    
    if (excludedProxy && getExclusionTimes(excludedProxy) >= this.maxExcludedTimes) {
      return true;
    }

    return false;
  }

  /**
   * Mark a proxy as excluded (failed health check)
   */
  markAsExcluded(proxy: ProxyWithMetadata): void {
    const key = getProxyKey(proxy);
    
    // Add to excluded map if not already there
    if (!this.excludedProxiesMap.has(key)) {
      this.excludedProxiesMap.set(key, proxy);
    }
    
    // Increment exclusion times
    incrementExclusionTimes(proxy);
  }

  /**
   * Mark a proxy as not excluded (passed health check)
   */
  markAsNotExcluded(proxy: ProxyWithMetadata): void {
    const key = getProxyKey(proxy);
    
    // Remove from excluded map
    this.excludedProxiesMap.delete(key);
    
    // Clear exclusion metadata
    clearExclusionTimes(proxy);
  }

  /**
   * Get all currently excluded proxies
   */
  getExcludedProxies(): ProxyWithMetadata[] {
    return Array.from(this.excludedProxiesMap.values());
  }
}
