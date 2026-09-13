"use client";

import { mapPicks } from "@floc/core/trip/explore/explore-match";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { useEffect, useRef } from "react";

import "leaflet/dist/leaflet.css";

import { firstBase } from "@/components/explore/listing";
import { MAX_ZOOM, TILE_ATTRIBUTION, TILE_URL } from "@/lib/map";

const PICKS = mapPicks(PRESET_TRIPS, 2);

export function ExploreAtlas({
  picked,
  onPick,
}: {
  picked: string;
  onPick: (presetId: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const pins = useRef(new Map<string, HTMLElement>());
  const pick = useRef(onPick);
  pick.current = onPick;
  const current = useRef(picked);
  current.current = picked;

  const mark = () => {
    for (const [id, node] of pins.current) {
      node.classList.toggle("is-picked", id === current.current);
      node.setAttribute("aria-pressed", String(id === current.current));
    }
  };

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let map: import("leaflet").Map | null = null;
    let cancelled = false;
    const onResize = () => map?.invalidateSize({ animate: false });

    void import("leaflet").then((L) => {
      if (cancelled || !host.current) return;
      // Why: a live wheel over a page-wide map traps page scroll (ticket 77).
      // Zoom sits bottom right: the title card covers the top left.
      // Why: below the zoom where one world fills the frame, the map shows every continent twice.
      const minZoom = Math.ceil(Math.log2(Math.max(el.clientWidth, el.clientHeight) / 256));
      map = L.map(el, {
        scrollWheelZoom: false,
        zoomControl: false,
        minZoom,
        maxBounds: [[-85, -180], [85, 180]],
        maxBoundsViscosity: 1,
      });
      L.control.zoom({ position: "bottomright" }).addTo(map);
      map.attributionControl.setPrefix(false);
      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: MAX_ZOOM, noWrap: true }).addTo(map);

      // Why: a marker has no element until the map has a view. One world fills
      // the width at minZoom, so centring south of the equator keeps Patagonia and
      // Oceania in frame.
      map.setView([0, 20], minZoom, { animate: false });
      for (const [index, trip] of PICKS.entries()) {
        const { lat, lng } = firstBase(trip);
        const marker = L.marker([lat, lng], {
          title: trip.title,
          alt: `${index + 1}. ${trip.title}, ${trip.nights} nights`,
          icon: L.divIcon({
            className: "explore-pin",
            html: `<span>${index + 1}</span>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          }),
        })
          .on("click", () => pick.current(trip.id))
          .addTo(map);
        const node = marker.getElement();
        if (node) pins.current.set(trip.id, node);
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
      map?.remove();
    };
  }, []);

  useEffect(mark);

  return (
    <div className="route-map-frame h-full min-h-[22rem] rounded-none border-0 lg:min-h-[32rem]">
      <div ref={host} className="route-map-canvas" style={{ height: "100%", minHeight: "inherit" }} />
      <div aria-hidden className="route-map-wash" />
      <div aria-hidden className="route-map-vignette" />
    </div>
  );
}
