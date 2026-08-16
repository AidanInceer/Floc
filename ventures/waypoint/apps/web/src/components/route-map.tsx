"use client";

// Map at the top of Route (v0.2 ticket 08, docs/mockups/route-map.html
// treatment C won).
//
// - Wheel zoom only arms after a click (ticket 77) — the map spans page width
//   so a live wheel would trap page scroll; Leaflet has no guard for that.
// - Paper look is a CSS filter stack + ruled wash over plain OSM tiles, no
//   second tile provider. Attribution control untouched.
// - Leaflet loaded lazily in an effect — it touches `window` at import time.
//
// Degradation (CLAUDE.md rule 11): a stop with no coordinates is simply not
// pinned; the page reports how many were left off.
import { useEffect, useRef } from "react";

import "leaflet/dist/leaflet.css";

import { MAX_ZOOM, TILE_ATTRIBUTION, TILE_URL } from "@/lib/map";

export type RouteMapStop = {
  /** Position in the FULL stop list, 1-based — so a pin's number matches its card. */
  no: number;
  name: string;
  /** Days the itinerary spends here — the yellow badge on the pin (ticket 69). */
  days: number;
  lat: number;
  lng: number;
};

/** Zoom used when there is a single point to show — a town, not a country. */
const SINGLE_STOP_ZOOM = 9;
/** Bounds are never zoomed past this, so a two-hotel route isn't a street map. */
const FIT_MAX_ZOOM = 12;

export function RouteMap({
  stops,
  missing,
}: {
  stops: RouteMapStop[];
  /** Stops with no coordinates — named so the omission is never silent. */
  missing: string[];
}) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el || stops.length === 0) return;

    let map: import("leaflet").Map | null = null;
    let cleanup = () => {};
    let cancelled = false;

    void import("leaflet").then((L) => {
      if (cancelled || !host.current) return;

      map = L.map(el, {
        attributionControl: true,
        // Off until the map is clicked — see the note at the top.
        scrollWheelZoom: false,
      });

      // mouseout fires on every pin crossed, so disable hangs off the
      // container's mouseleave instead (doesn't bubble). Arming is sticky for
      // the map's life (ticket 82) — leaving and returning re-arms rather
      // than demanding another click.
      let engaged = false;
      const armWheel = () => {
        engaged = true;
        map?.scrollWheelZoom.enable();
      };
      const rearmWheel = () => {
        if (engaged) map?.scrollWheelZoom.enable();
      };
      const disarmWheel = () => map?.scrollWheelZoom.disable();
      map.on("click", armWheel);
      el.addEventListener("mouseenter", rearmWheel);
      el.addEventListener("mouseleave", disarmWheel);

      L.tileLayer(TILE_URL, {
        attribution: TILE_ATTRIBUTION,
        maxZoom: MAX_ZOOM,
      }).addTo(map);

      const pts = stops.map((s) => [s.lat, s.lng] as [number, number]);

      if (pts.length > 1) {
        // className, not a colour option — var(--pen) doesn't resolve as an SVG attribute.
        L.polyline(pts, {
          className: "route-line",
          weight: 2,
          dashArray: "6 5",
        }).addTo(map);
      }

      for (const s of stops) {
        L.marker([s.lat, s.lng], {
          keyboard: false,
          icon: L.divIcon({
            className: "route-pin",
            // "2 days", not "2d" (ticket 82) — an abbreviation only the map used read as a code.
            html: `<span>${s.no}</span><b class="day-pill route-pin-days">${s.days} ${
              s.days === 1 ? "day" : "days"
            }</b>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          }),
          title: `${s.no}. ${s.name} — ${s.days} ${s.days === 1 ? "day" : "days"}`,
          alt: `Stop ${s.no}: ${s.name}, ${s.days} ${s.days === 1 ? "day" : "days"}`,
        }).addTo(map);
      }

      // Container often measures zero at init inside a flex/grid page; re-fit
      // once laid out and on resize, or fitBounds lands on the centroid at max zoom.
      const fit = () => {
        if (!map) return;
        map.invalidateSize({ animate: false });
        if (pts.length === 1) {
          map.setView(pts[0], SINGLE_STOP_ZOOM, { animate: false });
        } else {
          map.fitBounds(pts, {
            padding: [34, 34],
            maxZoom: FIT_MAX_ZOOM,
            animate: false,
          });
        }
      };

      fit();
      requestAnimationFrame(fit);
      window.addEventListener("resize", fit);
      cleanup = () => {
        window.removeEventListener("resize", fit);
        el.removeEventListener("mouseenter", rearmWheel);
        el.removeEventListener("mouseleave", disarmWheel);
      };
    });

    return () => {
      cancelled = true;
      cleanup();
      map?.remove();
    };
  }, [stops]);

  if (stops.length === 0) return null;

  return (
    <figure className="route-map">
      <div className="route-map-frame">
        <div ref={host} className="route-map-canvas" />
        <div aria-hidden className="route-map-wash" />
        <div aria-hidden className="route-map-vignette" />
      </div>
      {/* The caption that explained the numbered pins and the yellow day badge
          is gone (ticket 79) — the drawing says it. What stays is the one
          thing the map cannot show: the stops that aren't on it (rule 11). */}
      {missing.length > 0 ? (
        <figcaption className="mt-1.5 text-xs text-ink-faint">
          Not on the map — no coordinates: {missing.join(", ")}.
        </figcaption>
      ) : null}
    </figure>
  );
}
