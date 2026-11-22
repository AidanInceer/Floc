import { deriveStops } from "@floc/core/itinerary/stops";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { EventSheet } from "./event-sheet";
import { OvernightForm, type OvernightChoice } from "./overnight-form";
import type { StayWrite } from "@floc/core/itinerary/stay/overnight-pick";
import { trpc } from "@/lib/api";
import { shortPlace, STOP_NOT_SET } from "@floc/core/itinerary/names/place-name";

export type OvernightDay = {
  id: number;
  date: string;
  overnightPlaceId: number | null;
  overnightPlaceName: string | null;
};

function knownPlaces(days: OvernightDay[]): { id: number; name: string }[] {
  return [
    ...new Map(
      days
        .filter((row) => row.overnightPlaceId !== null && row.overnightPlaceName !== null)
        .map((row) => [
          row.overnightPlaceId,
          { id: row.overnightPlaceId as number, name: row.overnightPlaceName as string },
        ]),
    ).values(),
  ];
}

export function OvernightLine({
  tripId,
  days,
  openAt,
  onClose,
}: {
  tripId: number;
  days: OvernightDay[];
  openAt: string | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [problem, setProblem] = useState<string | null>(null);

  const save = useMutation(trpc.itinerary.setOvernight.mutationOptions());
  const [busy, setBusy] = useState(false);

  const saveStay = async (writes: StayWrite[], place: OvernightChoice | null) => {
    setBusy(true);
    try {
      for (const w of writes) {
        await save.mutateAsync({ tripId, startDate: w.start, endDate: w.end, place: w.clear ? null : place });
      }
      setProblem(null);
      onClose();
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setBusy(false);
      queryClient.invalidateQueries({ queryKey: trpc.itinerary.days.queryKey({ tripId }) });
    }
  };

  if (openAt === null) return null;

  const stop = deriveStops(
    days.map((row) => ({
      dayId: row.id,
      date: row.date,
      overnightPlaceId: row.overnightPlaceId,
      overnightPlaceName: row.overnightPlaceName,
    })),
  ).find((run) => run.startDate === openAt);
  const start = openAt;

  return (
    <EventSheet
      open
      title={stop?.placeName ? shortPlace(stop.placeName) : STOP_NOT_SET}
      onClose={onClose}
    >
    <OvernightForm
      span={{
        start,
        end: stop?.endDate ?? start,
        placeId: stop?.placeId ?? null,
        placeName: stop?.placeName ?? null,
        days: days.map((row) => ({ date: row.date, placeId: row.overnightPlaceId, placeName: row.overnightPlaceName })),
      }}
      known={knownPlaces(days)}
      busy={busy}
      problem={problem}
      onCancel={onClose}
      onSave={saveStay}
    />
    </EventSheet>
  );
}
