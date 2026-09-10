/**
 * Tiles for the phone's route map (#no-ticket, the app half of v0.2 ticket 08).
 *
 * SAME TWO PROVIDERS AS THE WEB, for the same reason: with a MapTiler key the
 * classic colourful OSM style, without one raw OpenStreetMap tiles, so a build
 * with no key still draws a map (rule 11). `apps/web/src/lib/map.ts` is the
 * sibling — keep the pair honest, the two apps must not disagree about what a
 * map looks like.
 *
 * `EXPO_PUBLIC_` is the only prefix Expo inlines, and a MapTiler key is public
 * by design (restricted by referrer in their dashboard), so this is correct
 * rather than a leak.
 *
 * RASTER, DELIBERATELY. MapLibre would happily render the vector style, but
 * the web is on raster and matching it is worth more here than sharpness.
 *
 * The attribution must stay visible: MapTiler's terms and OSM's ODbL both
 * require it. `Map` shows it through its own attribution button, which is why
 * `attribution` is never switched off at the call site.
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

/**
 * A whole style built from one raster source. MapLibre needs a style document,
 * not a tile URL, and hosting one for a single layer would be a network round
 * trip and a thing to keep alive for no gain.
 */
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

/**
 * The style the travel map draws on: paper, no tiles.
 *
 * The countries are the drawing. Tiles under them would be a second map
 * competing with the shapes, and would drag a tile host into a screen that
 * needs no geography beyond an outline — which is the same call the web makes.
 */
export function paperStyle(background: string): StyleSpecification {
  return {
    version: 8,
    sources: {},
    layers: [
      { id: "paper", type: "background", paint: { "background-color": background } },
    ],
  };
}
