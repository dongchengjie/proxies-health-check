import core from "@actions/core";
import os from "os";

export const inputs = {
  "proxies-config-urls": core.getMultilineInput("proxies-config-urls", {
    required: true,
  }),
  "segment-size": Number(core.getInput("segment-size") || "100"),
  concurrency: Number(
    core.getInput("concurrency") || os.availableParallelism()
  ),
  "test-url":
    core.getInput("test-url") || "https://www.google.com/generate_204",
  timeout: Number(core.getInput("timeout") || "1500"),
  "excluded-proxies-config-urls": core.getMultilineInput(
    "excluded-proxies-config-urls"
  ),
  "max-excluded-times": Number(core.getInput("max-excluded-times") || "3"),
  qualified: core.getInput("qualified") || "qualified.yaml",
  excluded: core.getInput("excluded") || "excluded.yaml",
  statistics: core.getInput("statistics") || "statistics.md",
};

core.info(JSON.stringify(inputs, null, 2));
