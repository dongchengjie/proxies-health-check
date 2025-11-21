/**
 * Core proxy types
 */

export interface Proxy {
  type: string;
  name: string;
  server: string;
  port: number;
  // Additional proxy-specific fields vary by type
  // Using unknown for type safety - cast when needed
  [key: string]: unknown;
}

export interface ProxyWithMetadata extends Proxy {
  _excluded_times?: number;
}

export interface ExcludedProxy {
  type: string;
  server: string;
  port: number;
  _excluded_times: number;
}

export interface HealthCheckResult {
  proxy: Proxy;
  delay: number;
}

export interface ProxyHealthCheckResult {
  qualifiedProxies: Proxy[];
  excludedProxies: ProxyWithMetadata[];
}
