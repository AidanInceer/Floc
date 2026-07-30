"use client";

/**
 * The map at the top of Route (v0.2 ticket 08, prototyped in
 * docs/mockups/route-map.html — treatment C, "paper-toned", won).
 *
 * Three decisions worth knowing before editing this file:
 *
 * 1. Pan, zoom and the scroll wheel are all on — but the wheel only after the
 *    map has been clicked (ticket 77). The map spans the page width, so a
 *    live wheel zoom would trap the reader's scroll on the way down the Route
 *    tab; Leaflet has no guard of its own for that. Click activates the
 *    wheel, moving the pointer off the map deactivates it again, so scrolling
 *    past costs nothing and zooming costs one click. A fixed-view/interactive
 *    toggle was built and then dropped on request — one map, always
 *    draggable, is less to explain.
 * 2. The paper look is CSS over plain OSM tiles — a filter stack on the tile
 *    pane plus a multiply-blended ruled wash on top. No second tile provider,
 *    no account, no extra request. OSM's attribution control is untouched.
 * 3. Leaflet is loaded lazily inside an effect. It touches `window` at import
 *    time, so a static import would break the server render.
 *
 * Degradation (CLAUDE.md rule 11): a stop whose place has no coordinates is
 * simply not pinned, and the page says how many were left off. Nothing here
 * throws, and the caller renders nothing at all when no stop has coordinates.
 */

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

      // Click to zoom with the wheel, leave to give the scroll back (ticket
      // 77). `mouseout` fires on every pin and control the pointer crosses,
      // so the disable hangs off the DOM container's `mouseleave`, which
      // doesn't bubble and only fires on the way out of the frame.
      const armWheel = () => map?.scrollWheelZoom.enable();
      const disarmWheel = () => map?.scrollWheelZoom.disable();
      map.on("click", armWheel);
      el.addEventListener("mouseleave", disarmWheel);

      L.tileLayer(TILE_URL, {
        attribution: TILE_ATTRIBUTION,
        maxZoom: MAX_ZOOM,
      }).addTo(map);

      const pts = stops.map((s) => [s.lat, s.lng] as [number, number]);

      if (pts.length > 1) {
        // The colour is a class, not an option: Leaflet writes `color` out as
        // an SVG presentation attribute, where `var(--pen)` does not resolve.
        L.polyline(pts, {
          className: "route-line",
          weight: 2,
          dashArray: "6 5",
        }).addTo(map);
      }

      for (const s of stops) {
        // Both values are numbers off `deriveStops`, never user text — the
        // place name goes through Leaflet's `title`/`alt` options, which it
        // sets as attributes rather than as markup.
        L.marker([s.lat, s.lng], {
          keyboard: false,
          icon: L.divIcon({
            className: "route-pin",
            html: `<span>${s.no}</span><b class="route-pin-days">${s.days}d</b>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          }),
          title: `${s.no}. ${s.name} — ${s.days} ${s.days === 1 ? "day" : "days"}`,
          alt: `Stop ${s.no}: ${s.name}, ${s.days} ${s.days === 1 ? "day" : "days"}`,
        }).addTo(map);
      }

      // Leaflet measures the container at init; inside a flex/grid page it is
      // often still zero then, and fitBounds would land on the centroid at
      // max zoom. Re-fit once the browser has laid out, and on every resize.
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
      <figcaption className="mt-1.5 text-xs text-ink-faint">
        {stops.length === 1
          ? `One stop pinned: ${stops[0].name}.`
          : `${stops.length} stops, pinned in order.`}{" "}
        Each pin carries its number; the yellow badge is how many days the
        itinerary spends there.
        {missing.length > 0
          ? ` Not on the map — no coordinates: ${missing.join(", ")}.`
          : ""}
      </figcaption>
    </figure>
  );
}
