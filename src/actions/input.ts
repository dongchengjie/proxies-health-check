import core from "@actions/core";
import os from "os";

export const inputs = {
  proxies_config_urls: core.getMultilineInput("proxies_config_urls", {
    required: true,
  }),
  segment_size: Number(core.getInput("segment_size") || "100"),
  concurrency: Number(
    core.getInput("concurrency") || os.availableParallelism()
  ),
  test_url: core.getInput("test_url") || "https://www.google.com/generate_204",
  timeout: Number(core.getInput("timeout") || "1500"),
  excluded_proxies_config_urls: core.getMultilineInput(
    "excluded_proxies_config_urls"
  ),
  max_excluded_times: Number(core.getInput("max_excluded_times") || "3"),
  qualified: core.getInput("qualified") || "qualified.yaml",
  excluded: core.getInput("excluded") || "excluded.yaml",
};

core.info(JSON.stringify(inputs, null, 2));
