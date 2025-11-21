/**
 * Config adapter - transforms GitHub Actions inputs to application config
 */

import core from "@actions/core";
import os from "os";
import type { AppConfig } from "../types/config";

export class ConfigAdapter {
  static fromGitHubActions(): AppConfig {
    const config: AppConfig = {
      proxiesConfigUrls: core.getMultilineInput("proxies_config_urls", {
        required: true,
      }),
      segmentSize: Number(core.getInput("segment_size") || "100"),
      concurrency: Number(
        core.getInput("concurrency") || os.availableParallelism()
      ),
      testUrl: core.getInput("test_url") || "https://www.google.com/generate_204",
      timeout: Number(core.getInput("timeout") || "1500"),
      excludedProxiesConfigUrls: core.getMultilineInput(
        "excluded_proxies_config_urls"
      ),
      maxExcludedTimes: Number(core.getInput("max_excluded_times") || "3"),
      qualifiedOutputPath: core.getInput("qualified") || "qualified.yaml",
      excludedOutputPath: core.getInput("excluded") || "excluded.yaml",
    };

    core.info(JSON.stringify(config, null, 2));
    return config;
  }
}
