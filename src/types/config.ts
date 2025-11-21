/**
 * Configuration types
 */

export interface AppConfig {
  proxiesConfigUrls: string[];
  segmentSize: number;
  concurrency: number;
  testUrl: string;
  timeout: number;
  excludedProxiesConfigUrls: string[];
  maxExcludedTimes: number;
  qualifiedOutputPath: string;
  excludedOutputPath: string;
}

export interface SubscriptionConfig {
  name: string;
  url: string;
}

export interface CollectionConfig {
  name: string;
  subscriptions: string[];
}
