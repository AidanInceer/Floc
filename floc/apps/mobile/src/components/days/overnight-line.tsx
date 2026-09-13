/**
 * The overnight line on a day, and the form behind it (ticket 308).
 *
 * DAY-FIRST (rule 3). `deriveStops` reads the run the selected day sits in;
 * saving writes `overnight_place_id` across that run's days. No stop is stored.
 *
 * THE LINE IS THE CONTROL. `OvernightRow` draws it; this file is the read, the
 * write, and the run `deriveStops` gives back.
 */
import { deriveStops } from "@floc/core/itinerary/stops";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { OvernightForm } from "./overnight-form";
import { OvernightRow } from "./overnight-row";
import { trpc } from "@/lib/api";

export type OvernightDay = {
  id: number;
  date: string;
  overnightPlaceId: number | null;
  overnightPlaceName: string | null;
};

function bookingFacts(trip: { members: unknown[]; bookingPrefill: boolean } | undefined) {
  return trip
    ? { groupSize: trip.members.length, bookingPrefill: trip.bookingPrefill }
    : { groupSize: 1, bookingPrefill: false };
}

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
  date,
}: {
  tripId: number;
  /** Every day of the trip, date ascending — a run can reach past this one. */
  days: OvernightDay[];
  date: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const trip = useQuery(trpc.trips.get.queryOptions({ tripId }));

  const save = useMutation({
    ...trpc.itinerary.setOvernight.mutationOptions(),
    onSuccess: () => {
      setOpen(false);
      setProblem(null);
      queryClient.invalidateQueries({ queryKey: trpc.itinerary.days.queryKey({ tripId }) });
    },
    onError: (error) => setProblem(error.message),
  });

  const day = days.find((row) => row.date === date);
  const stop = deriveStops(
    days.map((row) => ({
      dayId: row.id,
      date: row.date,
      overnightPlaceId: row.overnightPlaceId,
      overnightPlaceName: row.overnightPlaceName,
    })),
  ).find((run) => (day ? run.dayIds.includes(day.id) : false));

  const start = stop?.startDate ?? date;

  if (open) {
    return (
      <OvernightForm
        span={{
          start,
          end: stop?.endDate ?? date,
          dates: days.map((row) => row.date).filter((row) => row >= start),
          placeId: stop?.placeId ?? null,
          placeName: stop?.placeName ?? null,
        }}
        // Sending an id back keeps the pin the map draws from; re-typing the
        // name would mint a second, coordinate-less place row.
        known={knownPlaces(days)}
        {...bookingFacts(trip.data)}
        busy={save.isPending}
        problem={problem}
        onCancel={() => setOpen(false)}
        onSave={(end, place) =>
          save.mutate({ tripId, startDate: start, endDate: end, place })
        }
      />
    );
  }

  return (
    <OvernightRow
      place={stop?.placeName ?? null}
      onPress={() => {
        setOpen(true);
        setProblem(null);
      }}
    />
  );
}
