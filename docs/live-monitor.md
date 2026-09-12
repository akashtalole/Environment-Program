# Live Environmental Monitor

Inspired by [World Monitor](https://www.worldmonitor.app/) ([open source, AGPL-3.0](https://github.com/koala73/worldmonitor)) — which streams geopolitical and market signals onto one live map — this page applies the same idea to **environmental signals**: active wildfires, atmospheric aerosols, and live weather conditions, layered on a single interactive map.

<div id="monitor-map" style="height: 560px; border-radius: 8px; margin: 1.5em 0;"></div>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script>
(function () {
  function tempColor(t) {
    if (t == null) return "#888";
    if (t < 0) return "#3b82f6";
    if (t < 15) return "#22c55e";
    if (t < 25) return "#eab308";
    if (t < 35) return "#f97316";
    return "#ef4444";
  }

  var CITIES = [
    { name: "San Francisco", lat: 37.77, lon: -122.42 },
    { name: "Mexico City", lat: 19.43, lon: -99.13 },
    { name: "São Paulo", lat: -23.55, lon: -46.63 },
    { name: "Lagos", lat: 6.52, lon: 3.38 },
    { name: "Nairobi", lat: -1.29, lon: 36.82 },
    { name: "Cairo", lat: 30.04, lon: 31.24 },
    { name: "London", lat: 51.51, lon: -0.13 },
    { name: "Delhi", lat: 28.61, lon: 77.21 },
    { name: "Jakarta", lat: -6.21, lon: 106.85 },
    { name: "Beijing", lat: 39.9, lon: 116.4 },
    { name: "Sydney", lat: -33.87, lon: 151.21 },
    { name: "Reykjavik", lat: 64.15, lon: -21.94 }
  ];

  function initMap() {
    var map = L.map("monitor-map", { worldCopyJump: true }).setView([15, 10], 2);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 12
    }).addTo(map);

    // NASA GIBS: public WMTS raster tiles, no API key required.
    // Omitting the {Time} path segment serves the most recent available composite.
    var aerosols = L.tileLayer(
      "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Combined_Value_Added_AOD/default/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png",
      {
        maxZoom: 6,
        maxNativeZoom: 6,
        tileSize: 256,
        opacity: 0.6,
        attribution: "Aerosols: NASA GIBS / MODIS Aerosol Optical Depth (air-pollution proxy, daily composite)"
      }
    );

    var fires = L.layerGroup();
    var weatherLayer = L.layerGroup();

    L.control
      .layers(
        {},
        {
          "🔥 Active wildfires (NASA EONET)": fires,
          "🌫️ Aerosols / air-pollution proxy (MODIS AOD)": aerosols,
          "🌡️ Live weather stations (Open-Meteo)": weatherLayer
        },
        { collapsed: false }
      )
      .addTo(map);

    fires.addTo(map);
    weatherLayer.addTo(map);

    // NASA EONET: free, no API key, CORS-enabled (Access-Control-Allow-Origin: *).
    fetch("https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires&status=open&limit=200")
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        (data.events || []).forEach(function (ev) {
          var geom = ev.geometry && ev.geometry[ev.geometry.length - 1];
          if (!geom || geom.type !== "Point") return;
          var lon = geom.coordinates[0];
          var lat = geom.coordinates[1];
          var marker = L.circleMarker([lat, lon], {
            radius: 5,
            color: "#7f1d1d",
            weight: 1,
            fillColor: "#f97316",
            fillOpacity: 0.85
          });
          var sourceUrl = ev.sources && ev.sources[0] && ev.sources[0].url;
          marker.bindPopup(
            "<strong>" +
              ev.title +
              "</strong>" +
              (geom.date ? "<br>Last update: " + geom.date : "") +
              (sourceUrl ? '<br><a href="' + sourceUrl + '" target="_blank" rel="noopener">Source ↗</a>' : "")
          );
          marker.addTo(fires);
        });
      })
      .catch(function () {
        /* fires layer simply stays empty if the request fails */
      });

    // Open-Meteo: free, no API key, CORS-enabled — safe to call directly from the browser.
    CITIES.forEach(function (city) {
      var url =
        "https://api.open-meteo.com/v1/forecast?latitude=" +
        city.lat +
        "&longitude=" +
        city.lon +
        "&current=temperature_2m,precipitation,wind_speed_10m";

      fetch(url)
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          var c = data.current || {};
          var marker = L.circleMarker([city.lat, city.lon], {
            radius: 8,
            color: "#222",
            weight: 1,
            fillColor: tempColor(c.temperature_2m),
            fillOpacity: 0.9
          });
          marker.bindPopup(
            "<strong>" +
              city.name +
              "</strong><br>" +
              "Temp: " +
              (c.temperature_2m != null ? c.temperature_2m + "°C" : "n/a") +
              "<br>Wind: " +
              (c.wind_speed_10m != null ? c.wind_speed_10m + " km/h" : "n/a") +
              "<br>Precip: " +
              (c.precipitation != null ? c.precipitation + " mm" : "n/a")
          );
          marker.addTo(weatherLayer);
        })
        .catch(function () {
          /* skip a city if its request fails; the rest of the map still renders */
        });
    });
  }

  if (typeof L === "undefined") {
    window.addEventListener("load", initMap);
  } else {
    initMap();
  }
})();
</script>

*Map tip: use the layer switcher (top right) to toggle wildfires, aerosols, and live weather stations. Click any marker for details.*

## What's live vs. what isn't

| Layer | Source | Update cadence | Key needed? |
|---|---|---|---|
| Active wildfires | [NASA EONET](https://eonet.gsfc.nasa.gov/) (Earth Observatory Natural Event Tracker) | Near real-time, as incidents are reported | No |
| Aerosols / air-pollution proxy | [NASA GIBS](https://nasa-gibs.github.io/gibs-api-docs/) (MODIS Aerosol Optical Depth) | Daily composite | No |
| Live weather | [Open-Meteo](https://open-meteo.com/) | Real-time, fetched on page load | No |
| Ground-station air quality | *Not embedded here* | — | Yes (OpenAQ and WAQI/AQICN both require an API key **and** neither supports browser CORS) |
| Deforestation alerts | *Not embedded here* | — | Yes (Global Forest Watch's GLAD alert API requires an access token) |

For ground-station air quality and deforestation alerts, explore the source platforms directly:

- [Global Forest Watch — live map](https://www.globalforestwatch.org/map/) ↗
- [OpenAQ — global air quality explorer](https://explore.openaq.org/) ↗
- [IQAir World Air Quality Map](https://www.iqair.com/air-quality-map) ↗

## Why this isn't a full World Monitor clone

World Monitor runs a **backend** that continuously polls hundreds of feeds, stores history, and correlates signals with AI. This project deploys as a static site on GitHub Pages, so this page instead:

- Uses only sources that (a) require no secret API key, and (b) explicitly support CORS for direct browser calls — so nothing needs to be proxied or hidden.
- Renders satellite imagery at its native update cadence (a daily composite for aerosols) rather than true real-time telemetry.
- Links out to authoritative live dashboards (GFW, OpenAQ, IQAir) for signals that need authenticated, server-side access — including NASA's own FIRMS fire-detection API, which is more complete than EONET's incident feed but requires a personal `MAP_KEY` and doesn't support browser CORS.

This repository now includes exactly that kind of backend, in [`backend/`](https://github.com/akashtalole/Environment-Program/tree/main/backend) — a small Node.js service that polls FIRMS' NRT fire API, OpenAQ's v3 API, and GFW's GLAD alerts server-side and serves the results over a JSON API. It's optional and not wired into this page: GitHub Pages only serves static files, so the backend needs to be deployed separately (see its README) and this page updated to call its public URL before ground-station air quality and deforestation alerts can appear here live. World Monitor's own code is AGPL-3.0 licensed; the backend in this repo is an independent implementation, not a fork of it.
