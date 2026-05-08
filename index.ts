import * as core from "@actions/core";
import { downloadSubscriptionCollection } from "./src/subscription";
import { inputs } from "./src/actions/input";
import { parse } from "yaml";
import { proxiesHealthCheck } from "./src/health-check";
import { normalize } from "./src/normalize";
import { outputQualifiedProxies, outputExcludedProxies } from "./src/output";

// Download proxies configuration
const urls = inputs["proxies_config_urls"].filter(Boolean);
const yaml = await downloadSubscriptionCollection(urls);

// Parse proxies configuration
core.info("🔍 Parsing proxies...");
const { proxies } = parse(yaml);
core.info(`✅ Parsed ${proxies.length} proxies.`);

// Perform health check
const healthCheckResult = await proxiesHealthCheck(proxies);
let { qualifiedProxies, excludedProxies } = healthCheckResult;

// Normalize proxy names
qualifiedProxies = inputs["normalize"]
  ? normalize(qualifiedProxies)
  : qualifiedProxies;

// Output results
outputQualifiedProxies(qualifiedProxies);
outputExcludedProxies(excludedProxies);
