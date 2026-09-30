import { useId } from "react";

import type { JourneyFrame } from "@/lib/landing/journey";
import { routePath } from "@/lib/landing/journey";
import type { RouteCrop } from "@/lib/landing/route-crop";
import { STILL_TILE_CREDITS, stillTileUrl } from "@/lib/map";
import "./still-route-map.css";

const TILE = 256;
const pct = (n: number, of: number) => `${((n / of) * 100).toFixed(3)}%`;

/**
 * A fixed crop of the map with the route drawn on top as far as `frame.drawn`.
 * `tiles` off leaves the paper blank — a card fanned out of sight loads nothing.
 */
export function StillRouteMap({
  crop,
  box,
  frame,
  total,
  tiles,
}: {
  crop: RouteCrop;
  box: { width: number; height: number };
  frame: JourneyFrame;
  total: number;
  tiles: boolean;
}) {
  const mask = `reveal-${useId().replace(/[^\w-]/g, "")}`;
  const d = routePath(crop.points);
  return (
    <div className="still-map" style={{ aspectRatio: `${box.width} / ${box.height}` }}>
      <div aria-hidden className="still-map-tiles">
        {tiles &&
          crop.tiles.map((t) => (
            <div
              key={`${t.x}-${t.y}`}
              className="absolute bg-cover"
              style={{
                backgroundImage: `url(${stillTileUrl(t.zoom, t.x, t.y)})`,
                left: pct(t.left, box.width),
                top: pct(t.top, box.height),
                width: pct(TILE, box.width),
                height: pct(TILE, box.height),
              }}
            />
          ))}
      </div>
      <svg viewBox={`0 0 ${box.width} ${box.height}`} aria-hidden className="absolute inset-0 size-full overflow-visible">
        <mask id={mask} maskUnits="userSpaceOnUse">
          <path
            d={d}
            fill="none"
            stroke="white"
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${total} ${total}`}
            strokeDashoffset={total - frame.drawn}
          />
        </mask>
        <path d={d} mask={`url(#${mask})`} className="still-map-line" />
        {crop.points.map(([x, y], i) => (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r={i === 0 ? 5.5 : 4.5}
            className={i === 0 ? "still-map-pin still-map-pin-first" : "still-map-pin"}
            style={{ opacity: frame.reached[i] ? 1 : 0 }}
          />
        ))}
      </svg>
      <span className="absolute bottom-1 right-1.5 rounded-[5px] bg-sheet/85 px-[5px] py-px text-[9.5px] text-ink-faint">
        {STILL_TILE_CREDITS.map((c, i) => (
          <a key={c.name} href={c.href} target="_blank" rel="noreferrer" className="hover:text-ink">
            {i > 0 && " "}© {c.name}
          </a>
        ))}
      </span>
    </div>
  );
}
