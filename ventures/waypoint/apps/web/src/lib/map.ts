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

/** Side of one OSM raster tile, in CSS pixels. */
export const TILE_SIZE = 256;

/**
 * A tile mosaic centred on a point — how a static map is drawn without a
 * static-image API (OSM has none). Returns the tiles to render and the offset
 * to shift them by so the point lands centred. 2×2 is the smallest mosaic
 * that still covers a wide box once centred — matters when a page shows ten.
 */
export function tileMosaic(lat: number, lng: number, zoom: number) {
  const n = 2 ** zoom;
  const xf = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const yf =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;

  const x0 = Math.round(xf) - 1;
  const y0 = Math.round(yf) - 1;

  const tiles: { key: string; url: string; left: number; top: number }[] = [];
  for (let dy = 0; dy < 2; dy++) {
    for (let dx = 0; dx < 2; dx++) {
      const x = ((x0 + dx) % n + n) % n; // wrap at the antimeridian
      const y = y0 + dy;
      if (y < 0 || y >= n) continue; // no tile past the poles
      tiles.push({
        key: `${x}-${y}`,
        url: TILE_URL.replace("{z}", String(zoom))
          .replace("{x}", String(x))
          .replace("{y}", String(y)),
        left: dx * TILE_SIZE,
        top: dy * TILE_SIZE,
      });
    }
  }

  return {
    tiles,
    width: 2 * TILE_SIZE,
    height: 2 * TILE_SIZE,
    /** Where the point sits inside the mosaic, in pixels from its top-left. */
    offsetX: (xf - x0) * TILE_SIZE,
    offsetY: (yf - y0) * TILE_SIZE,
  };
}
