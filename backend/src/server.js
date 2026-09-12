import express from "express";
import { config } from "./config.js";
import { getCacheEntry, getAllCacheEntries } from "./cache.js";
import { startScheduler, pollAll } from "./scheduler.js";

const app = express();

// Same-origin (or CORS-permissive) API for the static Live Monitor page to
// call, so browsers never need the upstream services' own keys or deal with
// their lack of CORS support.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, sources: getAllCacheEntries() });
});

app.get("/api/fires", (_req, res) => {
  res.json(getCacheEntry("fires"));
});

app.get("/api/air-quality", (_req, res) => {
  res.json(getCacheEntry("airQuality"));
});

app.get("/api/deforestation", (_req, res) => {
  res.json(getCacheEntry("deforestation"));
});

// Manual trigger for testing/ops; not linked from the frontend.
app.post("/api/refresh", async (_req, res) => {
  await pollAll();
  res.json({ ok: true, sources: getAllCacheEntries() });
});

app.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`);
  startScheduler();
});
