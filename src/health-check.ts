import { inputs } from "./actions/input";
import pLimit from "p-limit";
import * as core from "@actions/core";
import { stringify } from "yaml";
import { healthCheck, updateConfig } from "./apis/mihomo";
import {
  getExcludedProxies,
  shouldExcludeProxy,
  markProxyAsExcluded,
  markProxyAsNotExcluded
} from "./exclude";

export const uniqueKey = (proxy: any) => `${proxy.type}-${proxy.server}-${proxy.port}`;

export const proxiesHealthCheck = async (proxies: any[]) => {
  const qualifiedProxies: any[] = [];
  const excludedProxies: any[] = [];

  // Download excluded proxies configuration
  core.info("🔍 Parsing excluded proxies...");
  excludedProxies.push(...(await getExcludedProxies()));
  core.info(`✅ Parsed ${excludedProxies.length} excluded proxies.`);

  // Filter out excluded proxies
  proxies = proxies.filter(p => !shouldExcludeProxy(p, excludedProxies));
  core.info(`🔍 Starting health checks for ${proxies.length} proxies...`);

  const segmentSize = inputs["segment_size"];
  for (let i = 0; i < proxies.length; i += segmentSize) {
    const limit = pLimit(inputs["concurrency"]);
    const [start, end] = [i, Math.min(i + segmentSize - 1, proxies.length)];
    const segment = proxies.slice(start, end);

    try {
      try {
        core.info(
          `🔄 Patching configuration for segment [${start + 1}-${end + 1}/${proxies.length}]...`
        );
        await updateConfig(stringify({ proxies: segment }));
        core.info(
          `✅ Configuration for segment [${start + 1}-${end + 1}/${proxies.length}] patched.`
        );
      } catch {
        const validProxies = [];
        for (const proxy of segment) {
          try {
            await updateConfig(stringify({ proxies: [proxy] }));
            validProxies.push(proxy);
          } catch {}
        }
        await updateConfig(stringify({ proxies: validProxies }));
      }

      const requests = segment.map((proxy: any) => {
        return limit(async () => {
          const { test_urls, timeout } = inputs;
          const delays = await Promise.all(
            test_urls.map(async url => {
              return await healthCheck(proxy.name, url, inputs.expected_status, timeout);
            })
          );
          const valid = delays.filter(delay => delay > 0);
          const sum = valid.reduce((acc, cur) => acc + cur, 0);
          const delay = sum / valid.length / (valid.length / delays.length);
          return { proxy, delay };
        });
      });

      // Collect delays
      const delays = (await Promise.all(requests))
        .filter(item => item.delay > 0)
        .reduce(
          (acc, cur) => {
            acc[uniqueKey(cur.proxy)] = {
              proxy: cur.proxy,
              delay: cur.delay
            };
            return acc;
          },
          {} as Record<string, any>
        );

      // Exclude unqualified proxies
      for (const proxy of segment) {
        const delayResult = delays[uniqueKey(proxy)];
        if (delayResult !== undefined) {
          proxy._delay = delayResult.delay;
          markProxyAsNotExcluded(proxy, excludedProxies);
          qualifiedProxies.push(proxy);
        } else {
          markProxyAsExcluded(proxy, excludedProxies);
        }
      }

      core.info(
        `❤️ Segment [${start + 1}-${end + 1}/${qualifiedProxies.length}:${
          proxies.length
        }] health check completed.`
      );
    } catch (error) {
      core.error(`❌ Failed to health check segment [${start}-${end}]: ${error}`);
    }
  }
  core.info("✅ Health checks completed.");

  // Sort qualified proxies by delay
  qualifiedProxies
    .sort((a, b) => a._delay - b._delay)
    .forEach(proxy => {
      delete proxy._delay;
    });

  // Sort excluded proxies by unique key
  excludedProxies.sort((a, b) => {
    const keyA = uniqueKey(a);
    const keyB = uniqueKey(b);
    return keyA.localeCompare(keyB);
  });

  return { qualifiedProxies, excludedProxies };
};
