# Environment Program — Backend

A small Node.js/Express service that polls authenticated environmental data
feeds on a schedule and serves the results over a same-origin JSON API. It
exists to unblock the sources the static [Live Monitor](../docs/live-monitor.md)
page can't call directly from the browser: they need a secret API key, don't
support CORS, or both.

| Source | What it fetches | Why it needs a backend |
|---|---|---|
| [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) | Near-real-time fire detections (VIIRS, world, last 24h) | Requires a free `MAP_KEY`; no CORS |
| [OpenAQ v3](https://docs.openaq.org/) | Latest ground-station air quality readings | Requires an API key; no CORS |
| [Global Forest Watch](https://www.globalforestwatch.org/) | GLAD integrated deforestation alerts | Requires an API key; queries need a server-side AOI |

Each fetcher degrades gracefully: with no key configured it reports
`"not_configured"` instead of failing, so you can run this with zero keys and
add them one at a time.

## Setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env and add whichever keys you have — see the links in .env.example
npm start
```

The server listens on `PORT` (default `8080`) and polls all three sources
immediately on boot, then again on the `POLL_CRON` schedule (default: every
30 minutes).

## API

| Endpoint | Returns |
|---|---|
| `GET /api/health` | Status + last-updated time for every source |
| `GET /api/fires` | Cached FIRMS data as GeoJSON `FeatureCollection` |
| `GET /api/air-quality` | Cached OpenAQ station readings |
| `GET /api/deforestation` | Cached GFW GLAD alerts as GeoJSON `FeatureCollection` |
| `POST /api/refresh` | Re-polls all sources immediately (for testing/ops) |

Every response has the shape:

```json
{ "status": "ok" | "not_configured" | "error", "data": "...", "error": "...", "updatedAt": "ISO timestamp" }
```

CORS is wide open (`Access-Control-Allow-Origin: *`) so the static docs site
can call this API directly once it's deployed somewhere with a public URL.

## Notes on data sources

- **FIRMS**: uses the free `MAP_KEY` tier (5,000 requests / 10 minutes),
  registered at <https://firms.modaps.eosdis.nasa.gov/api/map_key>.
- **OpenAQ**: `/v3` has no combined "all latest values" feed like `/v2` did,
  so this samples the first `LOCATIONS_LIMIT` (25 by default, see
  `src/fetchers/airQuality.js`) locations returned by `/v3/locations` and
  fetches each one's latest readings individually, with a short delay between
  requests to stay under free-tier rate limits. Raise the limit if your plan
  allows more.
- **GFW GLAD alerts**: the Data API's `query/json` endpoint requires an area
  of interest (AOI) polygon — there's no "whole world" query. This defaults
  to a bounding box over an active deforestation frontier in Rondônia,
  Brazil; override it with your own region via `GFW_AOI_GEOJSON` in `.env`
  (a `Polygon`/`MultiPolygon` geometry as a JSON string). **This fetcher is
  unverified against a live key** — the request shape follows GFW's public
  docs, but if the response envelope differs from what's expected (`data` vs
  `results`), check `src/fetchers/deforestation.js` against what your key
  actually returns.

## Deploying

This is a plain long-running Node process — deploy it anywhere that runs
Node.js continuously (a small VM, Fly.io, Render, Railway, etc.). GitHub
Pages only serves static files, so the docs site can't host this itself; once
deployed, point the Live Monitor page at its public URL to wire in real
ground-station air quality and deforestation data instead of the linked-out
dashboards it uses today.

## License

MIT (see repository [LICENSE](../LICENSE)). Note this is an independent
implementation, not a fork of [World Monitor](https://github.com/koala73/worldmonitor)
(AGPL-3.0) — no code from that project was used.
