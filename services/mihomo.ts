import { spawn } from "child_process";
import axios from "axios";

const EXTERNAL_CONTROLLER_PORT = process.env.EXTERNAL_CONTROLLER_PORT || 9090;
const HEALTH_CHECK_URL = `http://127.0.0.1:${EXTERNAL_CONTROLLER_PORT}/`;
const TIMEOUT_MS = 30000;
const CHECK_INTERVAL_MS = 1000;

let mainProcess: ReturnType<typeof spawn> | null = null;

const startMihomoBackend = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log("🚀 Starting Mihomo backend...");

    const yaml = `
external-controller: 127.0.0.1:${EXTERNAL_CONTROLLER_PORT}
allow-lan: false
bind-address: "*"
mode: rule
unified-delay: true
log-level: error
ipv6: true
geox-url:
  geo-ip: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geoip.dat
  mmdb: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geoip.metadb
  asn: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/GeoLite2-ASN.mmdb
  geo-site: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite.dat
geo-auto-update: false
geo-update-interval: 24
dns:
  enable: true
  ipv6: false
  use-system-hosts: false
  cache-algorithm: arc
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  fake-ip-filter:
    - +.lan
    - +.local
    - +.msftconnecttest.com
    - +.msftncsi.com
  default-nameserver:
    - 223.5.5.5
    - 119.29.29.29
    - 1.1.1.1
    - 8.8.8.8
  nameserver:
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query
  proxy-server-nameserver:
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query
rules:
  - MATCH,REJECT
    `;
    const config = Buffer.from(yaml).toString("base64");

    mainProcess = spawn(
      "./services/mihomo",
      ["-config", config, "-d", "./services"],
      {
        stdio: process.env.NODE_ENV === "dev" ? "inherit" : "ignore",
        cwd: process.cwd(),
        detached: true,
      }
    );

    mainProcess.on("error", (error) => {
      console.error("❌ Failed to start Mihomo backend:", error);
      reject(error);
    });

    mainProcess.on("exit", (code, signal) => {
      if (code !== 0) {
        const errorMsg = `Mihomo backend process exited with code ${code}${
          signal ? ` and signal ${signal}` : ""
        }`;
        console.error("❌", errorMsg);
        reject(new Error(errorMsg));
      }
    });

    mainProcess.unref();
    setTimeout(resolve, 1000);
  });
};

const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(HEALTH_CHECK_URL, {
      timeout: 5000,
      validateStatus: (status) => status < 500,
    });

    if (response.data?.hello) return true;
    console.log(
      "⏳ Mihomo backend responded but status is not success:",
      response.data
    );
    return false;
  } catch (error: any) {
    if (error.code === "ECONNREFUSED") {
      console.log("⏳ Mihomo backend not ready yet, waiting...");
    } else if (error.response) {
      console.log(
        `⏳ Mihomo backend returned status ${error.response.status}, waiting...`
      );
    } else {
      console.log(`⏳ Mihomo backend health check failed: ${error.message}`);
    }
    return false;
  }
};

const waitForBackend = async (): Promise<void> => {
  const startTime = Date.now();
  let attempts = 0;

  console.log(`🚀 Waiting for Mihomo backend to start...`);

  while (Date.now() - startTime < TIMEOUT_MS) {
    attempts++;

    try {
      if (await checkBackendHealth()) {
        return;
      }
    } catch (error: any) {
      console.log(
        `⚠️ Mihomo backend health check attempt ${attempts} failed: ${error.message}`
      );
    }

    if (Date.now() - startTime < TIMEOUT_MS) {
      await new Promise((resolve) => setTimeout(resolve, CHECK_INTERVAL_MS));
    }
  }

  throw new Error(
    `❌ Mihomo backend failed to start within ${TIMEOUT_MS / 1000} seconds`
  );
};

const main = async () => {
  try {
    await startMihomoBackend();
    await waitForBackend();

    console.log(`📡 Mihomo backend is ready at ${HEALTH_CHECK_URL}`);

    process.exit(0);
  } catch (error: any) {
    console.error("💥 Failed to start Mihomo backend:", error.message);

    if (mainProcess) {
      mainProcess.kill("SIGTERM");
    }

    process.exit(1);
  }
};

main();
