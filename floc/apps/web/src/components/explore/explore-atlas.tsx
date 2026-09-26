"use client";

import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { useEffect, useRef } from "react";

import "leaflet/dist/leaflet.css";

import { firstBase } from "@/components/explore/listing";
import { MAX_ZOOM, TILE_ATTRIBUTION, TILE_URL } from "@/lib/map";

// Why: the postcard sits over the right of the map on a wide screen; a picked pin must land clear of it.
const CARD_CLEARANCE: [number, number] = [470, 40];

export function ExploreAtlas({
  picked,
  onPick,
}: {
  picked: string;
  onPick: (presetId: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef<import("leaflet").Map | null>(null);
  const pins = useRef(new Map<string, import("leaflet").Marker>());
  const pick = useRef(onPick);
  pick.current = onPick;
  const current = useRef(picked);
  current.current = picked;

  const mark = () => {
    for (const [id, marker] of pins.current) {
      const node = marker.getElement();
      node?.classList.toggle("is-picked", id === current.current);
      node?.setAttribute("aria-pressed", String(id === current.current));
    }
  };

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cancelled = false;
    const onResize = () => live.current?.invalidateSize({ animate: false });

    void import("leaflet").then((L) => {
      if (cancelled || !host.current) return;
      // Why: a live wheel over a page-wide map traps page scroll (ticket 77).
      // Why: below the zoom where one world fills the frame, the map shows every continent twice.
      const minZoom = Math.ceil(Math.log2(Math.max(el.clientWidth, el.clientHeight) / 256));
      const map = L.map(el, {
        scrollWheelZoom: false,
        zoomControl: false,
        minZoom,
        maxBounds: [[-85, -180], [85, 180]],
        maxBoundsViscosity: 1,
      });
      live.current = map;
      L.control.zoom({ position: "bottomleft" }).addTo(map);
      map.attributionControl.setPrefix(false);
      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: MAX_ZOOM, noWrap: true }).addTo(map);

      // Why: a marker has no element until the map has a view.
      map.setView([22, 10], minZoom, { animate: false });
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
  }, []);

  useEffect(() => {
    mark();
    const map = live.current;
    const marker = pins.current.get(picked);
    if (!map || !marker) return;
    const wide = map.getSize().x > 900;
    map.panInside(marker.getLatLng(), { paddingTopLeft: [60, 60], paddingBottomRight: wide ? CARD_CLEARANCE : [60, 60] });
  }, [picked]);

  return (
    <div className="route-map-frame explore-atlas h-full rounded-none border-0">
      <div ref={host} className="route-map-canvas" style={{ height: "100%", minHeight: "inherit" }} />
      <div aria-hidden className="route-map-wash" />
      <div aria-hidden className="route-map-vignette" />
    </div>
  );
}
