import { config } from "../config.js";

const SOURCE = "https://firms.modaps.eosdis.nasa.gov/api/area/csv";
// VIIRS_SNPP_NRT = near-real-time detections from the Suomi NPP satellite.
// "world/1" = global extent, last 1 day.
const DATASET = "VIIRS_SNPP_NRT";
const AREA = "world";
const DAY_RANGE = 1;

function parseCsv(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row = {};
    headers.forEach((h, i) => (row[h] = cells[i]));
    return row;
  });
}

function toGeoJson(rows) {
  return {
    type: "FeatureCollection",
    features: rows
      .filter((r) => r.latitude && r.longitude)
      .map((r) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [Number(r.longitude), Number(r.latitude)]
        },
        properties: {
          brightness: r.bright_ti4 ? Number(r.bright_ti4) : null,
          confidence: r.confidence || null,
          frp: r.frp ? Number(r.frp) : null,
          acquiredDate: r.acq_date || null,
          acquiredTime: r.acq_time || null,
          satellite: r.satellite || null,
          daynight: r.daynight || null
        }
      }))
  };
}

export async function fetchFires() {
  if (!config.firmsMapKey) {
    return { status: "not_configured", data: null, error: "FIRMS_MAP_KEY is not set" };
  }

  const url = `${SOURCE}/${config.firmsMapKey}/${DATASET}/${AREA}/${DAY_RANGE}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`FIRMS request failed: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  if (text.trim().toLowerCase().startsWith("invalid")) {
    throw new Error(`FIRMS rejected the request: ${text.trim()}`);
  }
  const rows = parseCsv(text);
  return { status: "ok", data: toGeoJson(rows) };
}
