"use client";

import { legMarks, type LegLine } from "@floc/core/trip/overview/leg-route";
import type { OverviewRoute } from "@floc/core/trip/overview/route";
import { Suspense, use, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { fitPadding, NAME_ROOM } from "@/lib/maps/fit-padding";
import type { GoogleMapsConfig } from "@/lib/maps/google-maps-config";
import { loadGoogleMaps, type GoogleMaps } from "@/lib/maps/load-google-maps";

import { Legs, StopPins, type Drawn } from "./map-marks";

type Lines = Promise<(LegLine | null)[]>;

const LONE_STOP_ZOOM = 9;
const NAMES_SHOW = "(min-width: 640px)";

function watchTheme(changed: () => void) {
  const watch = new MutationObserver(changed);
  watch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => watch.disconnect();
}
const themeNow = () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

function fitRoute(api: GoogleMaps, map: google.maps.Map, box: HTMLElement, route: OverviewRoute) {
  const card = box.closest("[data-overview-band]")?.querySelector("[data-overview-card]");
  const padding = fitPadding(box.getBoundingClientRect(), card ? card.getBoundingClientRect() : null, window.matchMedia(NAMES_SHOW).matches ? NAME_ROOM : 0);
  const spots = route.stops.map((s) => ({ lat: s.lat, lng: s.lng }));
  if (spots.length === 1) {
    map.setZoom(LONE_STOP_ZOOM);
    map.setCenter(spots[0]);
    map.panBy((padding.right - padding.left) / 2, 0);
    return;
  }
  const bounds = new api.core.LatLngBounds();
  for (const spot of spots) bounds.extend(spot);
  map.fitBounds(bounds, padding);
}

export function GoogleRouteMap({
  config,
  route,
  lines,
  label,
  fallback,
}: {
  config: GoogleMapsConfig;
  route: OverviewRoute;
  lines: Lines;
  label: string;
  fallback: ReactNode;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<GoogleMaps | null>(null);
  const [failed, setFailed] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const theme = useSyncExternalStore(watchTheme, themeNow, () => "light");

  useEffect(() => {
    let live = true;
    const fail = () => {
      if (live) setFailed(true);
    };
    (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = fail;
    loadGoogleMaps(config.key).then((loaded) => {
      if (live) setApi(loaded);
    }, fail);
    return () => {
      live = false;
    };
  }, [config.key]);

  useEffect(() => {
    const box = host.current;
    if (!api || !box) return;
    const made = new api.maps.Map(box, {
      mapId: config.mapId,
      colorScheme: theme === "dark" ? api.core.ColorScheme.DARK : api.core.ColorScheme.LIGHT,
      center: { lat: route.stops[0].lat, lng: route.stops[0].lng },
      zoom: LONE_STOP_ZOOM,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: { position: api.core.ControlPosition.LEFT_BOTTOM },
      gestureHandling: "cooperative",
      clickableIcons: false,
    });
    const fit = () => fitRoute(api, made, box, route);
    const watch = new ResizeObserver(fit);
    watch.observe(box);
    setMap(made);
    return () => {
      watch.disconnect();
      setMap(null);
    };
  }, [api, config.mapId, route, theme]);

  if (failed) return fallback;
  const drawn: Drawn | null = api && map ? { api, map, theme } : null;
  return (
    <div className="absolute inset-0">
      <div key={theme} ref={host} role="region" aria-label={label} className="size-full" />
      {drawn ? (
        <>
          <StopPins api={drawn.api} map={drawn.map} route={route} />
          <Suspense fallback={<Legs {...drawn} marks={legMarks(route, [])} />}>
            <StreamedLegs drawn={drawn} route={route} lines={lines} />
          </Suspense>
        </>
      ) : null}
    </div>
  );
}

function StreamedLegs({ drawn, route, lines }: { drawn: Drawn; route: OverviewRoute; lines: Lines }) {
  return <Legs {...drawn} marks={legMarks(route, use(lines))} />;
}
