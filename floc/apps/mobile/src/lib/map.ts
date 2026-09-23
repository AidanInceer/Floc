/**
 * Why: tiles for the phone's route map, sibling of `apps/web/src/lib/map.ts` — keep the pair
 * honest. MapTiler with a key, raw OpenStreetMap without one, so a keyless build still draws a map
 * (rule 11). `EXPO_PUBLIC_` is the only prefix Expo inlines and a MapTiler key is public by design,
 * restricted by referrer. Raster, to match the web, over vector sharpness. Attribution must stay
 * visible — MapTiler's terms and OSM's ODbL both require it.
 */
import type { StyleSpecification } from "@maplibre/maplibre-react-native";

const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY;

export const TILE_URL = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/openstreetmap/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`
  : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const TILE_ATTRIBUTION = MAPTILER_KEY
  ? "© MapTiler © OpenStreetMap contributors"
  : "© OpenStreetMap contributors";

/** OSM tiles top out at 19; MapTiler goes higher, but 19 is plenty here. */
export const MAX_ZOOM = 19;

// Why: MapLibre needs a style document, not a tile URL, and hosting one for a single layer is a
// round trip and a thing to keep alive for no gain.
export const TILE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    base: {
      type: "raster",
      tiles: [TILE_URL],
      tileSize: 256,
      maxzoom: MAX_ZOOM,
      attribution: TILE_ATTRIBUTION,
    },
  },
  layers: [{ id: "base", type: "raster", source: "base" }],
};

// Why: paper, no tiles — the countries are the drawing, and tiles would compete with the shapes
// and drag a tile host into a screen that needs no geography. Same call as the web.
export function paperStyle(background: string): StyleSpecification {
  return {
    version: 8,
    sources: {},
    layers: [
      { id: "paper", type: "background", paint: { "background-color": background } },
    ],
  };
}
