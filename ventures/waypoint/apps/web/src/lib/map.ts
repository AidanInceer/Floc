/**
 * Tile source for every map in the app (v0.2 tickets 15/12). Raw OpenStreetMap
 * tiles, rendered with Leaflet. OSM's usage policy requires
 * `TILE_ATTRIBUTION` be visible wherever tiles are shown (Leaflet's own
 * attribution control counts) — it's a hobby-scale allowance, revisit
 * self-hosted/paid tiles if traffic grows (ticket 10's roadmap).
 * https://operations.osmfoundation.org/policies/tiles/
 */
export const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** OSM's tiles top out here; asking for more returns 404s. */
export const MAX_ZOOM = 19;

