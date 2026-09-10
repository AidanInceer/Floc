"use client";

// Travel map on a profile (ticket 95) — visited countries in pastel green,
// want-to-go in pastel yellow.
//
// - No tile layer: filled shapes from public/countries-110m.geojson (Natural
//   Earth) drawn straight onto the page's own paper, no tile host dependency.
// - Fill is a className, never a Leaflet option — `color`/`fillColor` as SVG
//   presentation attributes don't resolve CSS vars.
// - A handful of countries (Singapore, Malta, Monaco, ~60 more) are Points at
//   1:110m and drawn as small circles — see scripts/build-countries.mjs.
// - Clicking cycles the displayed state (blank → yellow → green → blank); the
//   server maps "blank" over a trip-claimed country to a `none` row rather
//   than a delete — see app/profile/actions.ts.
import { useEffect, useRef, useState, useTransition } from "react";

import "leaflet/dist/leaflet.css";

import { COUNTRIES, countryName } from "@floc/core/people/countries";
import { Input, cx } from "../system/ui";

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
  // Optimistic; a failed write is corrected by the revalidate resetting `states`.
  const [local, setLocal] = useState(states);
  const [filter, setFilter] = useState("");
  const [, startTransition] = useTransition();

  const host = useRef<HTMLDivElement>(null);
  const layers = useRef(new Map<string, import("leaflet").Path>());
  const arm = useRef<() => void>(() => {});
  // Click handler installed once per layer, so it reads live state via ref.
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

      // Wheel zoom armed by a click, same as the Route map (tickets 77, 82) —
      // prevents a live wheel trapping page scroll. Leaflet doesn't bubble a
      // country layer's click to the map, so `paint` also arms the wheel;
      // otherwise the first click (usually on a country) wouldn't arm it.
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
    // Built once; paint/restyle read live values through refs, so nothing goes stale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Straight onto classList, not setStyle: Leaflet applies options.className
  // once at creation and never again. Toggle, don't overwrite — Leaflet keeps
  // its own classes (leaflet-interactive) on the same element.
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

  // Results only while you're typing: the full list was 200 rows of scroll
  // sitting under the map for the sake of the handful you'd ever click.
  const needle = filter.trim().toLowerCase();
  const listed = needle
    ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(needle))
    : [];

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
          {/* Accessible path — "click a 3px island" doesn't work for tiny countries or on a phone. */}
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Find a country…"
            aria-label="Find a country"
            autoComplete="off"
          />
          {needle ? (
          <ul className="mt-2 max-h-64 overflow-y-auto rounded-md bg-sheet-2">
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
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-sheet-3"
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
          ) : null}
        </div>
      ) : marked.length > 0 ? (
        // Read-only fallback list for anyone the drawing doesn't work for.
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
