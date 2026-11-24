"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type SyntheticEvent } from "react";

import type { TripColor } from "@floc/core/trip/trip-color";

import { pastTripMaps } from "@/app/trips/actions";
import { ChevronIcon } from "@/components/system/icons";
import { Button, ErrorText, busyMark } from "@/components/system/ui";
import type { PastTripMap } from "@/server/trips/past-trip-maps";
import { BarMap } from "./bar-map";

const PastMaps = createContext<Map<number, PastTripMap> | null>(null);

export function PastTripsSection({ count, children }: { count: number; children: ReactNode }) {
  const [maps, setMaps] = useState<Map<number, PastTripMap> | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const section = useRef<HTMLDetailsElement>(null);
  const asked = useRef(false);

  const load = useCallback(async () => {
    asked.current = true;
    setBusy(true);
    try {
      const rows = await pastTripMaps();
      setMaps(new Map(rows.map((row) => [row.id, row])));
      setFailed(false);
    } catch {
      asked.current = false;
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (section.current?.open && !asked.current) queueMicrotask(load);
  }, [load]);

  const onToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
    if (event.currentTarget.open && !asked.current) void load();
  };

  return (
    <details ref={section} className="past-trips" onToggle={onToggle}>
      <summary className="mx-auto flex h-[31px] w-fit cursor-pointer list-none items-center gap-2 text-ink-soft transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
        <ChevronIcon direction="down" size={15} className="past-trips-chevron shrink-0" />
        <span className="typed text-current">Past trips · {count}</span>
      </summary>
      {busy && !failed ? <p role="status" className="sr-only">Loading maps…</p> : null}
      {failed ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <ErrorText>Floc could not load the maps.</ErrorText>
          <Button variant="secondary" disabled={busy} aria-busy={busy || undefined} onClick={() => void load()}>
            Try again{busyMark(busy)}
          </Button>
        </div>
      ) : null}
      <PastMaps.Provider value={maps}>{children}</PastMaps.Provider>
    </details>
  );
}

export function PastBarMap({ tripId, tone }: { tripId: number; tone: TripColor }) {
  const entry = useContext(PastMaps)?.get(tripId);
  return entry ? <BarMap route={entry.route} tone={tone} /> : null;
}
