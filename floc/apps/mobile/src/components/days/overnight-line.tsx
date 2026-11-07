/**
 * The overnight form, opened from a stop's label on the day strip (ticket 308).
 *
 * DAY-FIRST (rule 3). `deriveStops` reads the run that starts on `openAt`;
 * saving writes `overnight_place_id` across that run's days. No stop is stored.
 */
import { addDays, formatShortRange, nightsBetween } from "@floc/core/dates/dates";
import { deriveStops } from "@floc/core/itinerary/stops";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { EventSheet } from "./event-sheet";
import { OvernightForm } from "./overnight-form";
import { trpc } from "@/lib/api";

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
  /** Every day of the trip, date ascending — a run can reach past this one. */
  days: OvernightDay[];
  /** First date of the stop being edited; null when the form is closed. */
  openAt: string | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [problem, setProblem] = useState<string | null>(null);

  const save = useMutation({
    ...trpc.itinerary.setOvernight.mutationOptions(),
    onSuccess: () => {
      setProblem(null);
      onClose();
      queryClient.invalidateQueries({ queryKey: trpc.itinerary.days.queryKey({ tripId }) });
    },
    onError: (error) => setProblem(error.message),
  });

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
  const checkOut = addDays(stop?.endDate ?? start, 1);
  const nights = nightsBetween(start, checkOut);

  return (
    <EventSheet
      open
      title={stop?.placeName?.split(",")[0] ?? "Not set"}
      subtitle={`${formatShortRange(start, checkOut)} · ${nights} ${nights === 1 ? "night" : "nights"}`}
      onClose={onClose}
    >
    <OvernightForm
      span={{
        start,
        end: stop?.endDate ?? start,
        dates: days.map((row) => row.date).filter((row) => row >= start),
        placeId: stop?.placeId ?? null,
        placeName: stop?.placeName ?? null,
      }}
      // Sending an id back keeps the pin the map draws from; re-typing the
      // name would mint a second, coordinate-less place row.
      known={knownPlaces(days)}
      busy={save.isPending}
      problem={problem}
      onCancel={onClose}
      onSave={(end, place) =>
        save.mutate({ tripId, startDate: start, endDate: end, place })
      }
    />
    </EventSheet>
  );
}
