/**
 * Tile source for the Route map (v0.2 tickets 15/12; MapTiler added for
 * English labels). Two providers, chosen at build time by whether a MapTiler
 * key is present:
 *
 * - With `NEXT_PUBLIC_MAPTILER_KEY`: MapTiler Streets, `language=en`, so place
 *   names read in English everywhere rather than the local script (Japanese in
 *   Japan, etc.). The key is public by design — MapTiler keys are restricted by
 *   HTTP referrer in their dashboard, not kept secret — so `NEXT_PUBLIC_` is
 *   correct.
 * - Without a key (dev, or unconfigured deploy): raw OpenStreetMap tiles, the
 *   original source. Labels stay local, but the map still works — rule 11,
 *   degrade don't crash.
 *
 * Whichever renders, its attribution must stay visible (Leaflet's own control
 * counts). OSM policy: https://operations.osmfoundation.org/policies/tiles/
 */
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;

export const TILE_URL = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}&language=en`
  : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const TILE_ATTRIBUTION = MAPTILER_KEY
  ? '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** OSM tiles top out at 19; MapTiler goes higher, but 19 is plenty here. */
export const MAX_ZOOM = 19;
