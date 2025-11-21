/**
 * Mihomo health checker adapter
 */

import axios from "axios";
import type { HealthChecker } from "../domain/health-check-service";

const EXTERNAL_CONTROLLER_PORT = process.env.EXTERNAL_CONTROLLER_PORT || 9090;

export class MihomoHealthChecker implements HealthChecker {
  async updateConfig(payload: string): Promise<void> {
    await axios.request({
      method: "put",
      url: "http://127.0.0.1:9090/configs",
      data: { path: "", payload },
      timeout: 5 * 60 * 1000,
    });
  }

  async check(
    proxyName: string,
    testUrl: string = "https://www.gstatic.com/generate_204",
    timeout: number = 5000
  ): Promise<number> {
    const url = `http://127.0.0.1:${EXTERNAL_CONTROLLER_PORT}/proxies/${encodeURIComponent(
      proxyName
    )}/delay?url=${encodeURIComponent(testUrl)}&timeout=${timeout}`;
    
    try {
      const response = await axios.request({
        method: "get",
        url,
        timeout: timeout + 1000,
      });
      
      const delay = response.data?.delay;
      return delay > 0 ? delay : -1;
    } catch (error) {
      return -1;
    }
  }
}
