"use client";

import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { useEffect, useRef, type RefObject } from "react";

import "leaflet/dist/leaflet.css";

import { clearOf, openArea } from "@/components/explore/atlas/atlas-frame";
import { firstBase } from "@/components/explore/listing";
import { FLY_S, still, useRouteFlight } from "@/components/explore/atlas/use-route-flight";
import { worldControl } from "@/components/explore/atlas/world-control";
import { MAX_ZOOM, TILE_ATTRIBUTION, TILE_URL } from "@/lib/map";

/** The trip whose route the map draws; `n` goes up on each pick, so picking it again draws it again. */
export type AtlasRoute = { id: string; n: number };

const PINS = PRESET_TRIPS.map((t) => {
  const { lat, lng } = firstBase(t);
  return [lat, lng] as [number, number];
});

export function ExploreAtlas({
  picked,
  route,
  card,
  onPick,
  onWorld,
}: {
  picked: string;
  route: AtlasRoute | null;
  /** The postcard over the map; fitted views stay clear of it. */
  card: RefObject<HTMLElement | null>;
  onPick: (presetId: string) => void;
  onWorld: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef<import("leaflet").Map | null>(null);
  const leaflet = useRef<typeof import("leaflet") | null>(null);
  const pins = useRef(new Map<string, import("leaflet").Marker>());
  const pick = useRef(onPick);
  pick.current = onPick;
  const current = useRef({ picked, routed: route?.id ?? null });
  current.current = { picked, routed: route?.id ?? null };

  const frame = (room = 0) => {
    const box = host.current?.getBoundingClientRect();
    return box ? clearOf(box, card.current?.getBoundingClientRect() ?? null, room) : {};
  };
  const open = () => {
    const box = host.current?.getBoundingClientRect() ?? new DOMRect();
    return openArea(box, card.current?.getBoundingClientRect() ?? null);
  };

  const mark = () => {
    const { picked: id, routed } = current.current;
    for (const [pinId, marker] of pins.current) {
      const node = marker.getElement();
      node?.classList.toggle("is-picked", pinId === id);
      node?.classList.toggle("is-routed", pinId === routed);
      node?.setAttribute("aria-pressed", String(pinId === id));
    }
  };

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cancelled = false;
    // Why: below the zoom where the world fills the frame's height, the map shows grey past the poles.
    const floor = () => Math.log2(el.clientHeight / 256);
    const onResize = () => {
      const map = live.current;
      if (!map) return;
      map.invalidateSize({ animate: false });
      map.setMinZoom(floor());
      if (!current.current.routed) map.fitBounds(PINS, { ...frame(), animate: false });
    };

    void import("leaflet").then((L) => {
      if (cancelled || !host.current) return;
      leaflet.current = L;
      const map = L.map(el, {
        // Why: a live wheel over a page-wide map traps page scroll (ticket 77).
        scrollWheelZoom: false,
        zoomControl: false,
        zoomSnap: 0.25,
        minZoom: floor(),
        maxBounds: [[-85, -540], [85, 540]],
        maxBoundsViscosity: 1,
      });
      live.current = map;
      L.control.zoom({ position: "bottomleft" }).addTo(map);
      map.attributionControl.setPrefix(false);
      // Why: the world is fitted left of the postcard, so the frame runs past 180°; the tiles wrap to fill it.
      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: MAX_ZOOM }).addTo(map);

      // Why: a marker has no element until the map has a view.
      map.fitBounds(PINS, { ...frame(), animate: false });
      for (const trip of PRESET_TRIPS) {
        const { lat, lng } = firstBase(trip);
        const marker = L.marker([lat, lng], {
          title: trip.title,
          alt: `${trip.title}, ${trip.nights} nights`,
          icon: L.divIcon({
            className: "explore-pin",
            html: `<i></i><span>${trip.country}</span>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          }),
        })
          .on("click", () => pick.current(trip.id))
          .addTo(map);
        pins.current.set(trip.id, marker);
      }

      mark();
      requestAnimationFrame(onResize);
      window.addEventListener("resize", onResize);
    });

    const markers = pins.current;
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      markers.clear();
      live.current?.remove();
      live.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the map is built once; later props reach it through refs
  }, []);

  useEffect(mark, [picked, route]);
  useRouteFlight(live, leaflet, route, { frame, open });

  const toWorld = useRef(() => {});
  toWorld.current = () => {
    live.current?.flyToBounds(PINS, { ...frame(), duration: FLY_S, animate: !still() });
    onWorld();
  };
  useEffect(() => {
    const map = live.current;
    const L = leaflet.current;
    if (!route || !map || !L) return;
    const control = worldControl(L, () => toWorld.current()).addTo(map);
    return () => void control.remove();
  }, [route]);

  return (
    <div className="route-map-frame explore-atlas relative h-full rounded-none border-0">
      <div ref={host} className="route-map-canvas" style={{ height: "100%", minHeight: "inherit" }} />
      <div aria-hidden className="route-map-wash" />
      <div aria-hidden className="route-map-vignette" />
    </div>
  );
}
