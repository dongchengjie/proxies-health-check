import { spawn } from "child_process";
import axios from "axios";
import { setSettings } from "../src/apis/sub-store";

const SUB_STORE_PORT = process.env.SUB_STORE_BACKEND_API_PORT || 3000;
const HEALTH_CHECK_URL = `http://127.0.0.1:${SUB_STORE_PORT}/`;
const TIMEOUT_MS = 30000;
const CHECK_INTERVAL_MS = 1000;

let mainProcess: ReturnType<typeof spawn> | null = null;

const startSubStoreBackend = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log("🚀 Starting Sub-Store backend...");

    mainProcess = spawn("bun", ["run", "./services/sub-store.js"], {
      stdio: "inherit",
      cwd: process.cwd(),
      detached: true,
    });

    mainProcess.on("error", (error) => {
      console.error("❌ Failed to start Sub-Store backend:", error);
      reject(error);
    });

    mainProcess.on("exit", (code, signal) => {
      if (code !== 0) {
        const errorMsg = `Sub-Store backend process exited with code ${code}${
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

    if (response.data?.status === "success") return true;
    console.log(
      "⏳ Sub-Store backend responded but status is not success:",
      response.data
    );
    return false;
  } catch (error: any) {
    if (error.code === "ECONNREFUSED") {
      console.log("⏳ Sub-Store backend not ready yet, waiting...");
    } else if (error.response) {
      console.log(
        `⏳ Sub-Store backend returned status ${error.response.status}, waiting...`
      );
    } else {
      console.log(`⏳ Sub-Store backend health check failed: ${error.message}`);
    }
    return false;
  }
};

const waitForBackend = async (): Promise<void> => {
  const startTime = Date.now();
  let attempts = 0;

  console.log(`🚀 Waiting for Sub-Store backend to start...`);

  while (Date.now() - startTime < TIMEOUT_MS) {
    attempts++;

    try {
      if (await checkBackendHealth()) {
        return;
      }
    } catch (error: any) {
      console.log(
        `⚠️ Sub-Store backend health check attempt ${attempts} failed: ${error.message}`
      );
    }

    if (Date.now() - startTime < TIMEOUT_MS) {
      await new Promise((resolve) => setTimeout(resolve, CHECK_INTERVAL_MS));
    }
  }

  throw new Error(
    `❌ Sub-Store backend failed to start within ${TIMEOUT_MS / 1000} seconds`
  );
};

const main = async () => {
  try {
    await startSubStoreBackend();
    await waitForBackend();

    console.log(`✅ Sub-Store backend is ready at ${HEALTH_CHECK_URL}`);

    // Configure Sub-Store settings
    await setSettings({ cacheThreshold: "20480", defaultTimeout: "30000" });

    process.exit(0);
  } catch (error: any) {
    console.error("💥 Failed to start Sub-Store backend:", error.message);

    if (mainProcess) {
      mainProcess.kill("SIGTERM");
    }

    process.exit(1);
  }
};

main();
