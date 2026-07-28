/**
 * A still map of one place — the picture at the top of an Explore listing
 * (v0.2 ticket 08).
 *
 * It was briefly framed as a perforated postage stamp; that treatment was
 * tried and REJECTED (2026-07-27) — don't bring it back. The picture sits in
 * the same plain ruled frame the Route map uses.
 *
 * It is a mosaic of raw OpenStreetMap tiles in plain `<img>` tags, not a
 * Leaflet map: there is nothing to pan or zoom on an inert listing, and a map
 * library per card would be a lot of JavaScript for a picture. The paper wash
 * and filter stack are the same treatment the Route map uses, so the two read
 * as one visual language.
 *
 * OSM's tile policy requires the attribution be visible wherever tiles are
 * shown. There is no per-card control here, so the caller must print it once
 * for the page — `/explore` does, under the listings.
 */
import { TILE_SIZE, tileMosaic } from "@/lib/map";

export function StaticMap({
  lat,
  lng,
  zoom,
  alt,
  className,
}: {
  lat: number;
  lng: number;
  zoom: number;
  /** Names the place — the image is content, not decoration. */
  alt: string;
  className?: string;
}) {
  const m = tileMosaic(lat, lng, zoom);

  return (
    <div
      role="img"
      aria-label={alt}
      className={`route-map-frame relative h-[124px] w-full ${className ?? ""}`}
    >
      <div
        className="map-tiles absolute"
        style={{
          width: m.width,
          height: m.height,
          left: `calc(50% - ${m.offsetX}px)`,
          top: `calc(50% - ${m.offsetY}px)`,
        }}
      >
        {m.tiles.map((t) => (
          // eslint-disable-next-line @next/next/no-img-element -- a third-party
          // raster tile at a fixed 256px; next/image would proxy it for no gain.
          <img
            key={t.key}
            src={t.url}
            alt=""
            width={TILE_SIZE}
            height={TILE_SIZE}
            loading="lazy"
            className="absolute max-w-none"
            style={{ left: t.left, top: t.top }}
          />
        ))}
      </div>
      <div aria-hidden className="route-map-wash" />
      <div aria-hidden className="route-map-vignette route-map-vignette-sm" />
    </div>
  );
}
