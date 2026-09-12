import "dotenv/config";

// Default area of interest for GFW GLAD alerts: a well-known active
// deforestation frontier in Rondônia, Brazilian Amazon. Override with your
// own region via GFW_AOI_GEOJSON (a Polygon/MultiPolygon geometry as JSON).
const DEFAULT_GFW_AOI = {
  type: "Polygon",
  coordinates: [
    [
      [-66, -12],
      [-60, -12],
      [-60, -8],
      [-66, -8],
      [-66, -12]
    ]
  ]
};

function parseAoi() {
  if (!process.env.GFW_AOI_GEOJSON) return DEFAULT_GFW_AOI;
  try {
    return JSON.parse(process.env.GFW_AOI_GEOJSON);
  } catch {
    console.warn("GFW_AOI_GEOJSON is not valid JSON; falling back to the default AOI");
    return DEFAULT_GFW_AOI;
  }
}

export const config = {
  port: Number(process.env.PORT) || 8080,
  pollCron: process.env.POLL_CRON || "*/30 * * * *",
  firmsMapKey: process.env.FIRMS_MAP_KEY || "",
  openaqApiKey: process.env.OPENAQ_API_KEY || "",
  gfwApiKey: process.env.GFW_API_KEY || "",
  gfwAoiGeoJson: parseAoi()
};
