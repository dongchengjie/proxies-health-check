/**
 * Subscription service - handles downloading and parsing proxy subscriptions
 */

import { nanoid } from "nanoid";
import { parse } from "yaml";
import type { Proxy, ProxyWithMetadata } from "../types/proxy";
import type { Logger } from "../domain/health-check-service";

export interface SubscriptionClient {
  addSubscription(name: string, url: string): Promise<void>;
  addCollection(name: string, subscriptions: string[]): Promise<void>;
  downloadCollection(name: string, target: string): Promise<string>;
}

export class SubscriptionService {
  constructor(
    private readonly client: SubscriptionClient,
    private readonly logger: Logger
  ) {}

  /**
   * Download and parse proxies from subscription URLs
   */
  async downloadProxies(urls: string[]): Promise<Proxy[]> {
    const filteredUrls = urls.filter(Boolean);
    
    if (filteredUrls.length === 0) {
      return [];
    }

    const yaml = await this.downloadSubscriptionCollection(filteredUrls, "ClashMeta");
    
    this.logger.info("🔍 Parsing proxies...");
    const parsed = parse(yaml);
    const proxies = parsed?.proxies || [];
    this.logger.info(`✅ Parsed ${proxies.length} proxies.`);
    
    return proxies;
  }

  /**
   * Download proxies that should be excluded
   */
  async downloadExcludedProxies(urls: string[]): Promise<ProxyWithMetadata[]> {
    const filteredUrls = urls.filter(Boolean);
    
    if (filteredUrls.length === 0) {
      return [];
    }

    try {
      const data = await this.downloadSubscriptionCollection(filteredUrls, "JSON");
      // When target is JSON, response should be an array
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  /**
   * Download a collection of subscriptions as YAML
   */
  private async downloadSubscriptionCollection(
    urls: string[],
    target: "ClashMeta"
  ): Promise<string>;
  
  /**
   * Download a collection of subscriptions as JSON
   */
  private async downloadSubscriptionCollection(
    urls: string[],
    target: "JSON"
  ): Promise<unknown[]>;
  
  /**
   * Download a collection of subscriptions
   */
  private async downloadSubscriptionCollection(
    urls: string[],
    target: string = "ClashMeta"
  ): Promise<string | unknown[]> {
    // Register individual subscriptions
    const subscriptions = urls.map((url) => ({
      name: nanoid(),
      url,
    }));

    await Promise.all(
      subscriptions.map((sub) => this.client.addSubscription(sub.name, sub.url))
    );
    this.logger.info("✅ Subscriptions registered.");

    // Create and download collection
    this.logger.info("📦 Registering subscription collection...");
    const collectionName = nanoid();
    await this.client.addCollection(
      collectionName,
      subscriptions.map((sub) => sub.name)
    );
    this.logger.info("✅ Subscription collection registered.");

    this.logger.info("📥 Downloading subscription collection...");
    const result = await this.client.downloadCollection(collectionName, target);
    this.logger.info("✅ Subscription collection downloaded.");

    return result;
  }
}
