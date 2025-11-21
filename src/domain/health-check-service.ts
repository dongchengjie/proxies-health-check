/**
 * Health check service - orchestrates proxy health checking
 */

import pLimit from "p-limit";
import type { Proxy, ProxyWithMetadata, HealthCheckResult, ProxyHealthCheckResult } from "../types/proxy";
import type { ExclusionService } from "./exclusion-service";
import { getProxyKey } from "../utils/proxy-utils";

export interface HealthChecker {
  check(proxyName: string, testUrl: string, timeout: number): Promise<number>;
  updateConfig(configYaml: string): Promise<void>;
}

export interface Logger {
  info(message: string): void;
  error(message: string): void;
  warning(message: string): void;
}

export class HealthCheckService {
  constructor(
    private readonly healthChecker: HealthChecker,
    private readonly exclusionService: ExclusionService,
    private readonly logger: Logger,
    private readonly configSerializer: (proxies: Proxy[]) => string
  ) {}

  /**
   * Perform health checks on a batch of proxies
   */
  async checkProxies(
    proxies: ProxyWithMetadata[],
    config: {
      segmentSize: number;
      concurrency: number;
      testUrl: string;
      timeout: number;
    }
  ): Promise<ProxyHealthCheckResult> {
    const qualifiedProxies: Proxy[] = [];
    const { segmentSize, concurrency, testUrl, timeout } = config;

    // Process proxies in segments
    for (let i = 0; i < proxies.length; i += segmentSize) {
      const end = Math.min(i + segmentSize, proxies.length);
      const segment = proxies.slice(i, end);

      if (segment.length === 0) continue;

      await this.processSegment(
        segment,
        { start: i, end, total: proxies.length },
        { concurrency, testUrl, timeout },
        qualifiedProxies
      );
    }

    this.logger.info("✅ Health checks completed.");

    return {
      qualifiedProxies,
      excludedProxies: this.exclusionService.getExcludedProxies(),
    };
  }

  /**
   * Process a single segment of proxies
   */
  private async processSegment(
    segment: ProxyWithMetadata[],
    position: { start: number; end: number; total: number },
    config: { concurrency: number; testUrl: string; timeout: number },
    qualifiedProxies: Proxy[]
  ): Promise<void> {
    const { start, end, total } = position;
    const { concurrency, testUrl, timeout } = config;

    try {
      this.logger.info(
        `🔄 Patching configuration for segment [${start + 1}-${end}/${total}]...`
      );

      // Update configuration with current segment
      await this.healthChecker.updateConfig(this.configSerializer(segment));

      // Create health check tasks with concurrency limit
      const limit = pLimit(concurrency);
      const tasks = segment
        .filter((proxy) => !this.exclusionService.shouldExclude(proxy))
        .map((proxy) =>
          limit(async (): Promise<HealthCheckResult> => ({
            proxy,
            delay: await this.healthChecker.check(proxy.name, testUrl, timeout),
          }))
        );

      // Execute all checks in parallel (with concurrency limit)
      const results = await Promise.all(tasks);

      // Build a map of successful checks
      const successfulChecks = new Map<string, HealthCheckResult>();
      for (const result of results) {
        if (result.delay > 0) {
          successfulChecks.set(getProxyKey(result.proxy), result);
        }
      }

      // Update exclusion status and collect qualified proxies
      for (const proxy of segment) {
        const key = getProxyKey(proxy);
        
        if (successfulChecks.has(key)) {
          this.exclusionService.markAsNotExcluded(proxy);
          qualifiedProxies.push(proxy);
        } else {
          this.exclusionService.markAsExcluded(proxy);
        }
      }

      this.logger.info(
        `✅ Segment [${start + 1}-${end}/${qualifiedProxies.length}:${total}] health check completed.`
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to health check segment [${start + 1}-${end}]: ${error}`
      );
    }
  }
}
