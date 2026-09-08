/**
 * The overnight line on a day, and the form behind it (ticket 308).
 *
 * DAY-FIRST (rule 3). `deriveStops` reads the run the selected day sits in;
 * saving writes `overnight_place_id` across that run's days. No stop is stored.
 *
 * THE LINE IS THE CONTROL. Tapping what it says opens the form — a labelled
 * row saying "overnight" above a pill saying "overnight" is the word twice.
 */
import { deriveStops } from "@floc/core/stops";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable } from "react-native";

import { OvernightForm } from "./overnight-form";
import { Body, Pill } from "./ui";
import { trpc } from "@/lib/api";

export type OvernightDay = {
  id: number;
  date: string;
  overnightPlaceId: number | null;
  overnightPlaceName: string | null;
};

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
        known={[
          ...new Map(
            days
              .filter((row) => row.overnightPlaceId !== null && row.overnightPlaceName !== null)
              .map((row) => [
                row.overnightPlaceId,
                { id: row.overnightPlaceId as number, name: row.overnightPlaceName as string },
              ]),
          ).values(),
        ]}
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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Set where you are sleeping"
      onPress={() => {
        setOpen(true);
        setProblem(null);
      }}
    >
      {stop?.placeName ? (
        <Pill word={`Overnight · ${stop.placeName}`} tone="mint" />
      ) : (
        <Body tone="ink-3">No overnight place set.</Body>
      )}
    </Pressable>
  );
}
