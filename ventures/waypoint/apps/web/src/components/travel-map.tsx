"use client";

/**
 * The travel map on a profile (ticket 95) — countries you've been to in pastel
 * green, countries you want to go to in pastel yellow.
 *
 * Three things worth knowing before editing this file:
 *
 * 1. **Leaflet with no tile layer.** The Route map is pins on raster tiles;
 *    this one is filled shapes, and a basemap would fight the fills for
 *    attention. The polygons come from `public/countries-110m.geojson` (Natural
 *    Earth, public domain) and are drawn straight onto the page's own paper —
 *    no tile host, so nothing here can fail because a tile server is down, and
 *    no attribution control to keep.
 * 2. **Colour is a class, never an option.** Leaflet writes `color`/`fillColor`
 *    out as SVG presentation attributes, where `var(--highlight-green)` does
 *    not resolve — same trap as the Route map's polyline. Every fill is a
 *    className and the tokens live in globals.css.
 * 3. **A handful of countries are Points, not Polygons.** 1:110m has no shape
 *    at all for Singapore, Malta, Monaco and ~60 others; they arrive as a dot
 *    and are drawn as a small circle. See scripts/build-countries.mjs.
 *
 * Clicking cycles what you *see* — blank → yellow → green → blank — and the
 * server works out what that means for the stored row, because "blank" over a
 * country one of your trips is claiming is a rejection (a `none` row) rather
 * than a deletion. See app/profile/actions.ts.
 */
import { useEffect, useRef, useState, useTransition } from "react";

import "leaflet/dist/leaflet.css";

import { COUNTRIES, countryName } from "@/lib/countries";
import { Input, cx } from "./ui";

export type MapState = "green" | "yellow";
/** What a click asks for — the displayed state, not the stored row. */
export type NextState = MapState | "blank";

const CLASS: Record<MapState, string> = {
  green: "country-green",
  yellow: "country-yellow",
};

/** blank → yellow → green → blank. Want-to-go first: it's the commoner mark. */
function cycle(current: MapState | undefined): NextState {
  if (!current) return "yellow";
  return current === "yellow" ? "green" : "blank";
}

export function TravelMap({
  states,
  editable = false,
  setMark,
}: {
  /** Country code → colour, trips and hand already merged by lib/travel-map.ts. */
  states: Record<string, MapState>;
  editable?: boolean;
  /** Server action. Required when `editable`. */
  setMark?: (code: string, next: NextState) => Promise<void>;
}) {
  // Optimistic: the fill flips on click and the action catches up. A failed
  // write is corrected by the revalidate, which resets `states`.
  const [local, setLocal] = useState(states);
  const [filter, setFilter] = useState("");
  const [, startTransition] = useTransition();

  const host = useRef<HTMLDivElement>(null);
  const layers = useRef(new Map<string, import("leaflet").Path>());
  /** Arms the wheel zoom — set once the map exists. See the note in the effect. */
  const arm = useRef<() => void>(() => {});
  // The click handler is installed once per layer, so it reads the live states
  // through a ref rather than closing over a stale render's copy.
  const latest = useRef(local);
  latest.current = local;

  useEffect(() => setLocal(states), [states]);

  function paint(code: string) {
    if (!editable || !setMark) return;
    const next = cycle(latest.current[code]);
    setLocal((prev) => {
      const copy = { ...prev };
      if (next === "blank") delete copy[code];
      else copy[code] = next;
      return copy;
    });
    startTransition(async () => {
      await setMark(code, next);
    });
  }

  /* The map itself — built once, then restyled by the effect below. */
  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let map: import("leaflet").Map | null = null;
    let cancelled = false;
    let cleanupResize = () => {};
    const registry = layers.current;

    void (async () => {
      // Leaflet touches `window` at import time, so it can only be loaded in
      // an effect — a static import would break the server render.
      const [L, res] = await Promise.all([
        import("leaflet"),
        fetch("/countries-110m.geojson"),
      ]);
      if (cancelled || !host.current) return;
      if (!res.ok) return; // rule 11: no shapes, but the list below still works
      const geo = (await res.json()) as GeoJSON.FeatureCollection;
      if (cancelled || !host.current) return;

      map = L.map(el, {
        attributionControl: false,
        // Off until the map is clicked — see the wheel note below.
        scrollWheelZoom: false,
        zoomControl: true,
        minZoom: 1,
        maxZoom: 6,
        worldCopyJump: false,
      });
      map.setView([25, 8], 1.4);

      /*
       * Wheel zoom, armed by a click — the same bargain the Route map struck
       * (tickets 77 and 82). The map spans the card, so a live wheel would
       * trap the reader's scroll on the way down the profile; Leaflet has no
       * guard of its own for that. Clicking says "I'm working in this map",
       * and that stays true when the pointer steps out of the frame, so
       * leaving and coming back re-arms rather than demanding another click.
       *
       * One difference from Route: there, only the map fires `click`. Here a
       * click usually lands on a country, and Leaflet doesn't bubble an
       * interactive layer's click up to the map — so `paint` arms the wheel
       * too. Otherwise the one click everybody makes first would be the one
       * click that doesn't arm it.
       */
      let engaged = false;
      const armWheel = () => {
        engaged = true;
        map?.scrollWheelZoom.enable();
      };
      const rearmWheel = () => {
        if (engaged) map?.scrollWheelZoom.enable();
      };
      const disarmWheel = () => map?.scrollWheelZoom.disable();
      arm.current = armWheel;
      map.on("click", armWheel);
      // `mouseout` fires on every shape the pointer crosses, so the disable
      // hangs off the container's `mouseleave`, which doesn't bubble.
      el.addEventListener("mouseenter", rearmWheel);
      el.addEventListener("mouseleave", disarmWheel);

      L.geoJSON(geo, {
        // Every shape starts unpainted; the styling effect fills them in.
        style: () => ({ className: "country", weight: 0.6 }),
        pointToLayer: (_f, latlng) =>
          L.circleMarker(latlng, { radius: 3.5, className: "country", weight: 0.6 }),
        onEachFeature: (feature, layer) => {
          const code = String(feature.id ?? "");
          if (!code) return;
          registry.set(code, layer as import("leaflet").Path);
          layer.bindTooltip(countryName(code), { sticky: true });
          layer.on("click", () => {
            arm.current();
            paint(code);
          });
        },
      }).addTo(map);

      // Leaflet measures its container at init, and inside a flex/grid page
      // that is often still zero — re-measure once the browser has laid out.
      const fit = () => map?.invalidateSize({ animate: false });
      requestAnimationFrame(fit);
      window.addEventListener("resize", fit);
      cleanupResize = () => {
        window.removeEventListener("resize", fit);
        el.removeEventListener("mouseenter", rearmWheel);
        el.removeEventListener("mouseleave", disarmWheel);
      };

      restyle();
    })();

    return () => {
      cancelled = true;
      cleanupResize();
      registry.clear();
      map?.remove();
    };
    // Built once. `paint` and `restyle` read live values through refs/state
    // setters, so nothing here goes stale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Straight onto the element's class list, not through `setStyle`: Leaflet
   * applies `options.className` when it first creates the path and never again,
   * so restyling through it silently does nothing. The two state classes are
   * toggled rather than the class attribute rewritten, because Leaflet keeps
   * its own classes (`leaflet-interactive`) on the same element.
   */
  function restyle() {
    for (const [code, layer] of layers.current) {
      const el = layer.getElement();
      if (!el) continue;
      const state = latest.current[code];
      el.classList.toggle(CLASS.green, state === "green");
      el.classList.toggle(CLASS.yellow, state === "yellow");
      el.classList.toggle("country-editable", editable);
    }
  }

  useEffect(restyle, [local, editable]);

  const visited = Object.values(local).filter((s) => s === "green").length;
  const wantToGo = Object.values(local).filter((s) => s === "yellow").length;

  const needle = filter.trim().toLowerCase();
  const listed = needle
    ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(needle))
    : COUNTRIES;

  const marked = COUNTRIES.filter((c) => local[c.code]);

  return (
    <div>
      <div className="travel-map-frame">
        <div ref={host} className="travel-map-canvas" />
      </div>

      {/* Status is never colour alone (CLAUDE.md) — the key names both fills,
          and the count says the same thing in words. */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="travel-key travel-key-green" />
          Been there
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="travel-key travel-key-yellow" />
          Want to go
        </span>
        <span>
          {visited} visited · {wantToGo} want to go
        </span>
      </div>

      {editable ? (
        <div className="mt-4">
          {/* The map is the toy; this is the accessible path. "Click a 3px
              island" is not a serious way to mark Singapore, Malta or anything
              at all on a phone. */}
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Find a country…"
            aria-label="Find a country"
            autoComplete="off"
          />
          <ul className="mt-2 max-h-64 overflow-y-auto rounded-sm border border-rule">
            {listed.length === 0 ? (
              <li className="px-2.5 py-2 text-sm text-ink-soft">
                No country by that name.
              </li>
            ) : (
              listed.map((c) => {
                const state = local[c.code];
                return (
                  <li key={c.code}>
                    <button
                      type="button"
                      onClick={() => paint(c.code)}
                      aria-pressed={Boolean(state)}
                      className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm hover:bg-sheet-2"
                    >
                      <span
                        aria-hidden
                        className={cx(
                          "travel-key",
                          state === "green" && "travel-key-green",
                          state === "yellow" && "travel-key-yellow",
                        )}
                      />
                      <span className="flex-1">{c.name}</span>
                      <span className="text-xs text-ink-faint">
                        {state === "green"
                          ? "been there"
                          : state === "yellow"
                            ? "want to go"
                            : ""}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          <p className="mt-1 text-xs text-ink-faint">
            Click a country — on the map or in the list — to cycle it: want to
            go, been there, then off again. Countries from your trips are filled
            in for you, and anything you set by hand stays set.
          </p>
        </div>
      ) : marked.length > 0 ? (
        // Read-only: the shapes carry it, but a list names them for anyone the
        // drawing doesn't work for.
        <p className="mt-3 text-sm text-ink-soft">
          {marked
            .filter((c) => local[c.code] === "green")
            .map((c) => c.name)
            .join(", ") || "Nowhere yet"}
          {marked.some((c) => local[c.code] === "yellow") ? (
            <>
              {" · "}
              <span className="text-ink-faint">
                Wants to go: {marked
                  .filter((c) => local[c.code] === "yellow")
                  .map((c) => c.name)
                  .join(", ")}
              </span>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
