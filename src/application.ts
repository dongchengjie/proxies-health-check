/**
 * Application - main orchestrator that wires everything together
 */

import { stringify } from "yaml";
import type { AppConfig } from "./types/config";
import type { Proxy } from "./types/proxy";
import { ConfigAdapter } from "./adapters/config-adapter";
import { ActionsLogger } from "./adapters/logger-adapter";
import { MihomoHealthChecker } from "./adapters/mihomo-adapter";
import { SubStoreClient } from "./adapters/sub-store-adapter";
import { ExclusionService } from "./domain/exclusion-service";
import { HealthCheckService } from "./domain/health-check-service";
import { SubscriptionService } from "./domain/subscription-service";
import { OutputService } from "./domain/output-service";

export class Application {
  private readonly config: AppConfig;
  private readonly logger: ActionsLogger;
  private readonly subscriptionService: SubscriptionService;
  private readonly outputService: OutputService;

  constructor() {
    // Initialize configuration and logger
    this.config = ConfigAdapter.fromGitHubActions();
    this.logger = new ActionsLogger();

    // Initialize services
    const subStoreClient = new SubStoreClient();
    this.subscriptionService = new SubscriptionService(subStoreClient, this.logger);
    this.outputService = new OutputService(this.logger);
  }

  /**
   * Run the application
   */
  async run(): Promise<void> {
    // Download proxies
    const proxies = await this.subscriptionService.downloadProxies(
      this.config.proxiesConfigUrls
    );

    // Download excluded proxies
    this.logger.info("🔍 Parsing excluded proxies...");
    const excludedProxies = await this.subscriptionService.downloadExcludedProxies(
      this.config.excludedProxiesConfigUrls
    );
    this.logger.info(`✅ Parsed ${excludedProxies.length} excluded proxies.`);

    // Create services
    const exclusionService = new ExclusionService(
      this.config.maxExcludedTimes,
      excludedProxies
    );

    const healthChecker = new MihomoHealthChecker();
    const healthCheckService = new HealthCheckService(
      healthChecker,
      exclusionService,
      this.logger,
      (proxies: Proxy[]) => stringify({ proxies })
    );

    // Perform health checks
    const result = await healthCheckService.checkProxies(proxies, {
      segmentSize: this.config.segmentSize,
      concurrency: this.config.concurrency,
      testUrl: this.config.testUrl,
      timeout: this.config.timeout,
    });

    // Write outputs
    this.outputService.writeQualifiedProxies(
      result.qualifiedProxies,
      this.config.qualifiedOutputPath
    );
    this.outputService.writeExcludedProxies(
      result.excludedProxies,
      this.config.excludedOutputPath
    );
  }
}
