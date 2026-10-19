"use client";

import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { useCallback, useEffect, useMemo, useRef, type RefObject } from "react";

import { openArea } from "@/components/explore/atlas/atlas-frame";
import { visitsOf } from "@/components/explore/atlas/route-visits";
import { firstBase, routeStops } from "@/components/explore/listing";
import { cx } from "@/components/system/ui";

import { useAtlasGlobe } from "./use-atlas-globe";
import "./explore-globe.css";

/** The trip whose route the globe draws; `n` goes up on each pick, so picking it again draws it again. */
export type AtlasRoute = { id: string; n: number };

// Every plane on the globe leaves from here, as on the landing page's globe.
const LONDON = { lat: 51.507, lng: -0.128 };
const PLACES = PRESET_TRIPS.map(firstBase);

/** Why: no tile layer and no map provider. The land is the outline file in `public/`, so the map costs nothing to serve. */
export function ExploreGlobe({
  picked,
  route,
  card,
  onPick,
  onWorld,
}: {
  picked: string;
  route: AtlasRoute | null;
  /** The postcard over the globe; the dome and a route stay clear of it. */
  card: RefObject<HTMLElement | null>;
  onPick: (presetId: string) => void;
  onWorld: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const clear = useCallback(
    () => openArea(host.current?.getBoundingClientRect() ?? new DOMRect(), card.current?.getBoundingClientRect() ?? null),
    [card],
  );
  const { canvas, flags, stops, globe } = useAtlasGlobe(LONDON, PLACES, clear);
  const at = PRESET_TRIPS.findIndex((t) => t.id === picked);
  const routed = route ? PRESET_TRIPS.find((t) => t.id === route.id) : undefined;
  const visits = useMemo(() => (routed ? visitsOf(routeStops(routed)) : []), [routed]);

  useEffect(() => {
    if (at >= 0) globe.current?.show(at);
  }, [at, globe]);

  useEffect(() => {
    if (routed) globe.current?.open(routeStops(routed));
    else globe.current?.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `route` is new on every pick, so the same trip draws again
  }, [route]);

  return (
    <div ref={host} className="explore-atlas relative h-full overflow-hidden">
      <canvas ref={canvas} className="explore-globe" role="img" aria-label="A globe with a pin on every trip. Drag to turn it." />
      <div ref={flags} className="explore-flags" inert={route !== null}>
        {PRESET_TRIPS.map((trip) => (
          <button key={trip.id} type="button" className="explore-pin" aria-pressed={trip.id === picked} aria-label={`${trip.title}, ${trip.nights} nights`} onClick={() => onPick(trip.id)}>
            <i />
            <span>{trip.country}</span>
          </button>
        ))}
      </div>
      <div ref={stops} className="explore-flags">
        {visits.map((visit) => (
          <div key={visit.label} hidden role="img" aria-label={`Stop ${visit.label}: ${visit.first.name}, ${visit.days}`} className={cx("route-pin nums", visit.stops.length > 1 && "is-twice")}>
            <span>{visit.label}</span>
            <div className="route-tag">
              <b className="rounded-full border border-highlight-edge bg-highlight px-[5px] font-mono text-[10px] font-bold leading-[15px] text-highlight-ink">{visit.days}</b>
              <em>{visit.first.name}</em>
            </div>
          </div>
        ))}
      </div>
      {route ? (
        <button type="button" onClick={onWorld} className="atlas-world">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" aria-hidden>
            <circle cx="7" cy="7" r="5.25" />
            <path d="M1.75 7h10.5M7 1.75c1.6 1.5 2.4 3.25 2.4 5.25S8.6 10.75 7 12.25M7 1.75C5.4 3.25 4.6 5 4.6 7s.8 3.75 2.4 5.25" />
          </svg>
          Every trip
        </button>
      ) : null}
    </div>
  );
}
