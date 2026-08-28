/**
 * Tile source for the Route map (v0.2 tickets 15/12). Two providers, chosen at
 * build time by whether a MapTiler key is present:
 *
 * - With `NEXT_PUBLIC_MAPTILER_KEY`: MapTiler's `openstreetmap` style, the
 *   classic colourful OSM look. The key is public by design — MapTiler keys are
 *   restricted by HTTP referrer in their dashboard, not kept secret — so
 *   `NEXT_PUBLIC_` is correct.
 * - Without a key (dev, or unconfigured deploy): raw OpenStreetMap tiles, the
 *   original source. The map still works — rule 11, degrade don't crash.
 *
 * These are raster tiles, and raster is the deliberate choice. MapTiler does
 * publish this style as vector (`style.json`), which would stay sharp between
 * zoom levels and prefer `name:en` labels — but rendering it needs MapLibre GL
 * inside Leaflet, and that was tried and reverted: the layer mounted and the
 * style, sprite and tiles.json all fetched 200, yet no vector tile (`.pbf`)
 * was ever requested and the canvas stayed blank. Don't retry without solving
 * that first.
 *
 * `language=en` is not sent because this raster style ignores it: the labels
 * are already painted into the JPEG in local script (Japanese in Japan, Greek
 * in Greece). Verified — the tile is byte-identical with and without it.
 *
 * Whichever renders, its attribution must stay visible. MapTiler's terms and
 * OSM's ODbL both require it; Leaflet's own "Leaflet" prefix does not, and is
 * switched off in route-map.tsx.
 * OSM policy: https://operations.osmfoundation.org/policies/tiles/
 */
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;

export const TILE_URL = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/openstreetmap/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`
  : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const TILE_ATTRIBUTION = MAPTILER_KEY
  ? '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** OSM tiles top out at 19; MapTiler goes higher, but 19 is plenty here. */
export const MAX_ZOOM = 19;
