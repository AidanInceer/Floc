"use client";

import { useEffect, useRef } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";

import "leaflet/dist/leaflet.css";

import { MAX_ZOOM, TILE_ATTRIBUTION, TILE_URL } from "@/lib/map";

type Stop = { lat: number; lng: number };
type Live = { L: typeof import("leaflet"); map: LeafletMap; layer: LayerGroup };

const FIT = { padding: [34, 34] as [number, number], maxZoom: 9 };

function draw({ L, map, layer }: Live, stops: Stop[], fly: boolean) {
  layer.clearLayers();
  const pts = stops.map((s) => L.latLng(s.lat, s.lng));
  if (pts.length > 1) L.polyline(pts, { className: "route-line", weight: 2, dashArray: "6 5", interactive: false }).addTo(layer);
  pts.forEach((p, i) => {
    const icon = L.divIcon({ className: "route-pin", html: `<span>${i + 1}</span>`, iconSize: [26, 26], iconAnchor: [13, 13] });
    L.marker(p, { icon, keyboard: false, interactive: false }).addTo(layer);
  });
  const bounds = L.latLngBounds(pts);
  if (fly) map.flyToBounds(bounds, { ...FIT, duration: 1.4 });
  else map.fitBounds(bounds, { ...FIT, animate: false });
}

/** One map for the whole shelf: picking another trip flies there rather than redrawing. */
export function BorrowMap({ stops }: { stops: Stop[] }) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef<Live | null>(null);
  const latest = useRef(stops);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cancelled = false;
    let refit = () => {};

    // Leaflet touches `window` at import time, so it loads here, not at the top.
    void import("leaflet").then((L) => {
      if (cancelled) return;
      const map = L.map(el, {
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        zoomControl: false,
        zoomSnap: 0.25,
      });
      map.attributionControl.setPrefix(false);
      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: MAX_ZOOM }).addTo(map);
      live.current = { L, map, layer: L.layerGroup().addTo(map) };
      refit = () => {
        map.invalidateSize({ animate: false });
        if (live.current) draw(live.current, latest.current, false);
      };
      refit();
      requestAnimationFrame(refit);
      window.addEventListener("resize", refit);
    });

    return () => {
      cancelled = true;
      window.removeEventListener("resize", refit);
      live.current?.map.remove();
      live.current = null;
    };
  }, []);

  useEffect(() => {
    latest.current = stops;
    if (!live.current || stops.length === 0) return;
    draw(live.current, stops, !matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, [stops]);

  return (
    <div className="route-map-frame">
      <div ref={host} className="borrow-map" />
      <div aria-hidden className="route-map-wash" />
      <div aria-hidden className="route-map-vignette" />
    </div>
  );
}
