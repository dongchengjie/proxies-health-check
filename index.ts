import core from "@actions/core";
import { downloadSubscriptionCollection } from "./src/subscription";
import { inputs } from "./src/actions/input";
import { parse } from "yaml";
import { proxiesHealthCheck } from "./src/health-check";
import {
  outputQualifiedProxies,
  outputExcludedProxies,
  outputStatistics,
} from "./src/output";

// Download proxies configuration
const urls = inputs["proxies-config-urls"].filter(Boolean);
const yaml = await downloadSubscriptionCollection(urls);

// Parse proxies configuration
core.info("🔍 Parsing proxies...");
const { proxies } = parse(yaml);
core.info(`✅ Parsed ${proxies.length} proxies.`);

// Perform health check
const healthCheckResult = await proxiesHealthCheck(proxies);
const { qualifiedProxies, excludedProxies, statistics } = healthCheckResult;

// Output results
outputQualifiedProxies(qualifiedProxies);
outputExcludedProxies(excludedProxies);
outputStatistics(statistics);
