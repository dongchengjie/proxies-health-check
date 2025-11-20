import { inputs } from "./actions/input";
import path from "path";
import { stringify } from "yaml";
import core from "@actions/core";
import fs from "fs-extra";

const workspace = process.env["GITHUB_WORKSPACE"] ? "/github/workspace" : "";

export const outputQualifiedProxies = (qualifiedProxies: any[]) => {
  if (qualifiedProxies.length > 0) {
    const qualifiedFile = path.resolve(workspace, inputs["qualified"]);
    fs.outputFileSync(
      qualifiedFile,
      stringify({
        mode: "rule",
        proxies: qualifiedProxies,
      })
    );
    core.info(`✅ Output ${qualifiedProxies.length} qualified proxies.`);
  } else {
    core.warning("⚠️ No qualified proxies found.");
  }
};

export const outputExcludedProxies = (excludedProxies: any[]) => {
  if (excludedProxies.length > 0) {
    const excludedFile = path.resolve(workspace, inputs["excluded"]);
    fs.outputFileSync(excludedFile, stringify({ proxies: excludedProxies }));
    core.info(`✅ Output ${excludedProxies.length} excluded proxies.`);
  } else {
    core.warning("⚠️ No excluded proxies found.");
  }
};
