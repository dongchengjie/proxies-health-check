import { nanoid } from "nanoid";
import { addSub, addCollection, downloadCollection } from "./apis/sub-store";
import core from "@actions/core";

export const downloadSubscriptionCollection = async (
  urls: string[],
  target: string = "ClashMeta"
) => {
  urls = urls.filter(Boolean);
  if (urls.length === 0) return "proxies: []";

  const subs = urls.map((url) => ({
    name: nanoid(),
    url,
  }));
  await Promise.all(
    subs.map((sub) => addSub(sub.name, sub.url))
  );
  core.info("✅ Subscriptions registered.");

  core.info("📦 Registering subscription collection...");
  const collection = nanoid();
  await addCollection(
    collection,
    subs.map((sub) => sub.name)
  );
  core.info("✅ Subscription collection registered.");

  core.info("📥 Downloading subscription collection...");
  const yaml = await downloadCollection(collection, target);
  core.info("✅ Subscription collection downloaded.");

  return yaml;
};
