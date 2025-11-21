/**
 * Output service - handles writing results to files
 */

import path from "path";
import fs from "fs-extra";
import { stringify } from "yaml";
import type { Proxy, ProxyWithMetadata } from "../types/proxy";
import type { Logger } from "../domain/health-check-service";
import { simplifyProxy } from "../utils/proxy-utils";
import { createClashMetaConfig } from "../config/clash-meta-template";

const workspace = process.env["GITHUB_WORKSPACE"] ? "/github/workspace" : "";

export class OutputService {
  constructor(private readonly logger: Logger) {}

  /**
   * Write qualified proxies to file
   */
  writeQualifiedProxies(proxies: Proxy[], outputPath: string): void {
    if (proxies.length === 0) {
      this.logger.warning("⚠️ No qualified proxies found.");
      return;
    }

    const filePath = path.resolve(workspace, outputPath);
    const config = createClashMetaConfig(proxies);
    
    fs.outputFileSync(filePath, stringify(config));
    this.logger.info(`✅ Output ${proxies.length} qualified proxies.`);
  }

  /**
   * Write excluded proxies to file
   */
  writeExcludedProxies(proxies: ProxyWithMetadata[], outputPath: string): void {
    if (proxies.length === 0) {
      this.logger.warning("⚠️ No excluded proxies found.");
      return;
    }

    const filePath = path.resolve(workspace, outputPath);
    const simplifiedProxies = proxies.map(simplifyProxy);
    
    fs.outputFileSync(filePath, stringify({ proxies: simplifiedProxies }));
    this.logger.info(`✅ Output ${proxies.length} excluded proxies.`);
  }
}
