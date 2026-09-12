import { config } from "../config.js";

const ENDPOINT = "https://data-api.globalforestwatch.org/dataset/gfw_integrated_alerts/latest/query/json";
const LOOKBACK_DAYS = 30;

function isoDateDaysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function toGeoJson(rows) {
  return {
    type: "FeatureCollection",
    features: rows
      .filter((r) => r.latitude != null && r.longitude != null)
      .map((r) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [Number(r.longitude), Number(r.latitude)]
        },
        properties: {
          date: r.gfw_integrated_alerts__date || null,
          confidence: r.gfw_integrated_alerts__confidence || null,
          intensity: r.gfw_integrated_alerts__intensity ?? null
        }
      }))
  };
}

export async function fetchDeforestation() {
  if (!config.gfwApiKey) {
    return { status: "not_configured", data: null, error: "GFW_API_KEY is not set" };
  }

  const sql =
    "SELECT longitude, latitude, gfw_integrated_alerts__date, gfw_integrated_alerts__intensity, " +
    "gfw_integrated_alerts__confidence FROM results WHERE gfw_integrated_alerts__date >= " +
    `'${isoDateDaysAgo(LOOKBACK_DAYS)}' LIMIT 2000`;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "x-api-key": config.gfwApiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ sql, geometry: config.gfwAoiGeoJson })
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GFW request failed: ${res.status} ${res.statusText} ${body}`.trim());
  }

  const json = await res.json();
  // GFW's Data API wraps query results as { status, data: [...] }; falling back
  // to `results` here too since this fetcher is unverified against a live key
  // (see README) and the exact envelope key is worth double-checking on first run.
  const rows = json.data || json.results || [];
  return { status: "ok", data: toGeoJson(rows) };
}
