import cron from "node-cron";
import { config } from "./config.js";
import { setCacheEntry } from "./cache.js";
import { fetchFires } from "./fetchers/fires.js";
import { fetchAirQuality } from "./fetchers/airQuality.js";
import { fetchDeforestation } from "./fetchers/deforestation.js";

const JOBS = [
  { key: "fires", run: fetchFires },
  { key: "airQuality", run: fetchAirQuality },
  { key: "deforestation", run: fetchDeforestation }
];

async function runJob({ key, run }) {
  try {
    const result = await run();
    setCacheEntry(key, result.status, result.data, result.error);
    console.log(`[${new Date().toISOString()}] ${key}: ${result.status}`);
  } catch (err) {
    setCacheEntry(key, "error", null, String(err.message || err));
    console.error(`[${new Date().toISOString()}] ${key}: error -`, err.message || err);
  }
}

export async function pollAll() {
  await Promise.all(JOBS.map(runJob));
}

export function startScheduler() {
  // Run once immediately so the cache is warm before the first cron tick.
  pollAll();
  cron.schedule(config.pollCron, pollAll);
  console.log(`Scheduler started with cron "${config.pollCron}"`);
}
