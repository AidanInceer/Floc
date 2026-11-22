"use client";

import { stopPins, type LegMark, type Spot } from "@floc/core/trip/overview/leg-route";
import type { OverviewRoute } from "@floc/core/trip/overview/route";
import { useLayoutEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { TravelModeIcon } from "@/components/system/icons/travel-mode";
import type { GoogleMaps } from "@/lib/maps/load-google-maps";

export type Drawn = { api: GoogleMaps; map: google.maps.Map; theme: string };
type OnMap = Omit<Drawn, "theme">;

const DASH = "M 0,-1 0,1";
const ON_ITS_MIDDLE = "translate-y-1/2";
const ON_ITS_NUMBER = "translate-x-[calc(50%-11px)] translate-y-1/2";

function Marker({ api, map, at, title, level, always, sits, children }: OnMap & { at: Spot; title: string; level: number; always: boolean; sits: string; children: ReactNode }) {
  const [box] = useState(() => {
    const el = document.createElement("div");
    el.className = sits;
    return el;
  });
  const { lat, lng } = at;
  useLayoutEffect(() => {
    const keeps = api.marker.CollisionBehavior;
    const marker = new api.marker.AdvancedMarkerElement({
      map,
      position: { lat, lng },
      content: box,
      title,
      zIndex: level,
      collisionBehavior: always ? keeps.REQUIRED_AND_HIDES_OPTIONAL : keeps.OPTIONAL_AND_HIDES_LOWER_PRIORITY,
    });
    return () => {
      try {
        marker.map = null;
      } catch {
        marker.remove();
      }
    };
  }, [api, map, lat, lng, box, title, level, always]);
  return createPortal(children, box);
}

function Line({ api, map, theme, mark }: Drawn & { mark: LegMark }) {
  useLayoutEffect(() => {
    const tokens = getComputedStyle(map.getDiv());
    const [ink, sheet] = [tokens.getPropertyValue("--ink").trim(), tokens.getPropertyValue("--sheet").trim()];
    const path = mark.points ?? [mark.from, mark.to];
    const geodesic = mark.points === null;
    const casing = new api.maps.Polyline({ map, path, geodesic, strokeColor: sheet, strokeOpacity: 1, strokeWeight: 6, zIndex: 1, clickable: false });
    const line = mark.points
      ? new api.maps.Polyline({ map, path, strokeColor: ink, strokeOpacity: 1, strokeWeight: 3, zIndex: 2, clickable: false })
      : new api.maps.Polyline({
          map,
          path,
          geodesic,
          strokeOpacity: 0,
          zIndex: 2,
          clickable: false,
          icons: [{ icon: { path: DASH, strokeColor: ink, strokeOpacity: 1, scale: 2.5 }, offset: "0", repeat: "12px" }],
        });
    return () => {
      casing.setMap(null);
      line.setMap(null);
    };
  }, [api, map, theme, mark]);
  return null;
}

export function StopPins({ api, map, route }: OnMap & { route: OverviewRoute }) {
  return stopPins(route).map((pin) => (
    <Marker key={pin.nos.join()} api={api} map={map} at={pin} title={`${pin.nos.join(", ")}: ${pin.place}`} level={20 + pin.nos[0]} always sits={ON_ITS_NUMBER}>
      <span className="flex items-center gap-1.5">
        <span className="nums grid h-[22px] min-w-[22px] place-items-center rounded-full border-[1.5px] border-ink bg-sheet px-1 text-xs text-ink shadow-card">
          {pin.nos.join(", ")}
        </span>
        <span className="max-w-[9rem] truncate rounded-sm bg-sheet px-1.5 py-0.5 text-sm font-semibold leading-tight text-ink shadow-card ring-1 ring-rule-strong max-sm:hidden">
          {pin.place}
        </span>
      </span>
    </Marker>
  ));
}

export function Legs({ api, map, theme, marks }: Drawn & { marks: LegMark[] }) {
  return marks.map((mark, i) => (
    <LegOnMap key={i} api={api} map={map} theme={theme} mark={mark} level={10 - i} />
  ));
}

function LegOnMap({ api, map, theme, mark, level }: Drawn & { mark: LegMark; level: number }) {
  return (
    <>
      <Line api={api} map={map} theme={theme} mark={mark} />
      {mark.label ? (
        <Marker api={api} map={map} at={mark.mid} title={mark.label} level={level} always={false} sits={ON_ITS_MIDDLE}>
          <span className="nums inline-flex h-5 items-center gap-1.5 whitespace-nowrap rounded-full bg-sheet px-2 text-xs text-ink-soft shadow-card ring-1 ring-rule-strong">
            {mark.mode ? <TravelModeIcon mode={mark.mode} /> : null}
            {mark.text}
          </span>
        </Marker>
      ) : null}
    </>
  );
}
