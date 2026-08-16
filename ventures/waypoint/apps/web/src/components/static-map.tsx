// Still map of one place, at the top of an Explore listing (v0.2 ticket 08).
// A postage-stamp treatment was tried and REJECTED (2026-07-27) — don't revive it.
//
// Raw OSM tile mosaic in plain <img> tags, not Leaflet — nothing to pan/zoom
// on an inert listing, and a map library per card is too much JS for a picture.
// Shares the Route map's paper wash/filter treatment.
//
// OSM's attribution requirement isn't met per-card here — the caller must
// print it once for the page (/explore does, under the listings).
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
          // A third-party raster tile at a fixed 256px; next/image would proxy
          // it for no gain.
          // eslint-disable-next-line @next/next/no-img-element
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
