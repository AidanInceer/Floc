/**
 * Tile source for every map in the app (v0.2 tickets 15/12). Raw OpenStreetMap
 * tiles — free, no account, no key — rendered with Leaflet.
 *
 * The attribution string is not decoration: OSM's tile usage policy requires
 * it be visible wherever tiles are shown. Any map component must render
 * `TILE_ATTRIBUTION` (Leaflet's own attribution control counts).
 *
 * That policy is a hobby-scale allowance — fine at v0.2 traffic, revisit
 * self-hosted or paid tiles if it grows (noted for ticket 10's roadmap).
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
 * A tile mosaic centred on a point — how a *static* map is drawn without a
 * static-image API (OSM has none, and Leaflet on an inert page would be a lot
 * of JavaScript for a picture). Returns the tiles to render and the offset to
 * shift them by so the point lands in the centre of whatever box clips them.
 *
 * The grid is 2×2 deliberately: four requests per image is the smallest mosaic
 * that still covers a wide box once centred, which matters when a page shows
 * ten of them (OSM's tile policy is a hobby-scale allowance — see above).
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
      if (y < 0 || y >= n) continue; // past the poles there is no tile
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
