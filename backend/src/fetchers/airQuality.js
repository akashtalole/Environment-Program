import { config } from "../config.js";

const BASE = "https://api.openaq.org/v3";

// OpenAQ v3 has no combined "all latest values" endpoint like v2 did: you list
// locations, then fetch each location's latest sensor readings separately.
// To stay well under free-tier rate limits this only samples the first N
// locations returned by /v3/locations (no geo filter = OpenAQ's default global
// ordering). Raise LOCATIONS_LIMIT below if your API plan allows more.
const LOCATIONS_LIMIT = 25;
const REQUEST_DELAY_MS = 250;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function openaqFetch(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "X-API-Key": config.openaqApiKey }
  });
  if (!res.ok) {
    throw new Error(`OpenAQ request failed (${path}): ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchAirQuality() {
  if (!config.openaqApiKey) {
    return { status: "not_configured", data: null, error: "OPENAQ_API_KEY is not set" };
  }

  const locationsPage = await openaqFetch(`/locations?limit=${LOCATIONS_LIMIT}`);
  const locations = locationsPage.results || [];

  const stations = [];
  for (const loc of locations) {
    const sensorById = new Map((loc.sensors || []).map((s) => [s.id, s.parameter]));
    try {
      const latest = await openaqFetch(`/locations/${loc.id}/latest`);
      const readings = (latest.results || []).map((r) => {
        const param = sensorById.get(r.sensorsId);
        return {
          parameter: param ? param.name : null,
          units: param ? param.units : null,
          value: r.value,
          datetimeUtc: r.datetime ? r.datetime.utc : null
        };
      });
      stations.push({
        id: loc.id,
        name: loc.name,
        latitude: loc.coordinates ? loc.coordinates.latitude : null,
        longitude: loc.coordinates ? loc.coordinates.longitude : null,
        readings
      });
    } catch (err) {
      // Skip a single bad/rate-limited station rather than failing the whole batch.
      stations.push({
        id: loc.id,
        name: loc.name,
        latitude: loc.coordinates ? loc.coordinates.latitude : null,
        longitude: loc.coordinates ? loc.coordinates.longitude : null,
        readings: [],
        error: String(err.message || err)
      });
    }
    await sleep(REQUEST_DELAY_MS);
  }

  return { status: "ok", data: { stations } };
}
