import { inputs } from "./actions/input";
import pLimit from "p-limit";
import core from "@actions/core";
import { stringify } from "yaml";
import { healthCheck, updateConfig } from "./apis/mihomo";
import {
  getExcludedProxies,
  shouldExcludeProxy,
  markProxyAsExcluded,
  markProxyAsNotExcluded,
} from "./exclude";

export const uniqueKey = (proxy: any) =>
  `${proxy.type}-${proxy.server}-${proxy.port}`;

export const proxiesHealthCheck = async (proxies: any[]) => {
  const qualifiedProxies: any[] = [];
  const excludedProxies: any[] = [];
  const statistics = [];

  // Download excluded proxies configuration
  core.info("🔍 Parsing excluded proxies...");
  excludedProxies.push(...(await getExcludedProxies()));
  core.info(`✅ Parsed ${excludedProxies.length} excluded proxies.`);

  const segmentSize = inputs["segment_size"];
  for (let i = 0; i < proxies.length; i += segmentSize) {
    const limit = pLimit(inputs["concurrency"]);
    const [start, end] = [i + 1, Math.min(i + segmentSize, proxies.length)];
    const segment = proxies.slice(start, end);

    try {
      core.info(
        `🔄 Patching configuration for segment [${start}-${end}/${proxies.length}]...`
      );
      await updateConfig(stringify({ proxies: segment }));

      const requests = segment
        .filter((proxy: any) => !shouldExcludeProxy(proxy, excludedProxies))
        .map((proxy: any) => {
          return limit(async () => {
            return {
              proxy,
              delay: await healthCheck(
                proxy.name,
                inputs["test_url"],
                inputs["timeout"]
              ),
            };
          });
        });

      // Collect delays
      const delays = (await Promise.all(requests))
        .filter((item) => item.delay > 0)
        .reduce((acc, cur) => {
          acc[uniqueKey(cur.proxy)] = cur.delay;
          return acc;
        }, {} as Record<any, number>);
      statistics.push(delays);

      // Exclude unqualified proxies
      for (const proxy of segment) {
        if (delays[uniqueKey(proxy)] !== undefined) {
          markProxyAsNotExcluded(proxy);
          qualifiedProxies.push(proxy);
        } else {
          markProxyAsExcluded(proxy, excludedProxies);
        }
      }

      core.info(
        `✅ Segment [${start}-${end}/${proxies.length}] health check completed.`
      );
    } catch (error) {
      core.error(
        `❌ Failed to health check segment [${start}-${end}]: ${error}`
      );
    }
  }
  core.info("✅ Health checks completed.");

  return { qualifiedProxies, excludedProxies, statistics };
};
