/**
 * Days (ticket 298) — the trip's timeline, one day at a time.
 *
 * DAY-FIRST (rule 3). The data is `day` rows with events hanging off them.
 * The "Overnight · Tokyo" heading is not a stop record: it comes from
 * `deriveStops`, which reads consecutive days sharing an overnight place. No
 * `stop` table exists and none ever will.
 *
 * ONE DAY ON SCREEN, THE REST IN THE STRIP. The web app lists every day down
 * the page because it has the room. A phone does not, so the strip is the
 * spine and the day below it is the detail. Same data, different shape — which
 * is the reason the two UIs are separate at all.
 *
 * TIMES ARE LOCAL TO THE ITINERARY (rule 10). `HH:MM` is displayed exactly as
 * stored; nothing here consults the device's timezone.
 *
 * UNDATED IS NOT BROKEN (rule 9). A trip with no days says so and points at
 * Dates. It is not gated, refused, or treated as an error state (rule 4).
 */
import { today } from "@floc/core/dates";
import { formatDate } from "@floc/core/dates";
import { orderEvents } from "@floc/core/event-order";
import { deriveStops } from "@floc/core/stops";
import type { DayEventType } from "@floc/core/vocabulary";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { DayStrip } from "@/components/day-strip";
import { EventForm, type EventDraft } from "@/components/event-form";
import {
  Body,
  Button,
  Card,
  Empty,
  Failed,
  Figure,
  Label,
  Loading,
  Pill,
} from "@/components/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

/** What the API wants, from what the form produced. The two differ only in the fields a phone never sets. */
function toInput(draft: EventDraft) {
  return {
    type: draft.type as DayEventType,
    title: draft.title,
    transportType: null,
    time: draft.time,
    endTime: null,
    allDay: draft.allDay,
    note: draft.note,
  };
}

/** Nothing open, adding to this day, or editing this event. One state, so two cannot both be true. */
type Editing = { kind: "none" } | { kind: "add" } | { kind: "edit"; eventId: number };

export default function Days() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  // A screen keeps rendering for a frame while it leaves, and `id` is gone by
  // then: NaN goes down the wire as null and the server rightly refuses it.
  const ready = Number.isFinite(tripId);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [chosen, setChosen] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing>({ kind: "none" });
  const [problem, setProblem] = useState<string | null>(null);

  const days = useQuery(trpc.itinerary.days.queryOptions({ tripId }, { enabled: ready }));

  const done = () => {
    setEditing({ kind: "none" });
    setProblem(null);
    queryClient.invalidateQueries({ queryKey: trpc.itinerary.days.queryKey({ tripId }) });
  };
  const failed = (error: { message: string }) => setProblem(error.message);

  const addEvent = useMutation({
    ...trpc.itinerary.addEvent.mutationOptions(),
    onSuccess: done,
    onError: failed,
  });
  const updateEvent = useMutation({
    ...trpc.itinerary.updateEvent.mutationOptions(),
    onSuccess: done,
    onError: failed,
  });
  const deleteEvent = useMutation({
    ...trpc.itinerary.deleteEvent.mutationOptions(),
    onSuccess: done,
    onError: failed,
  });

  if (days.isPending) return <Loading />;
  if (days.isError) return <Failed onRetry={() => days.refetch()} />;

  if (days.data.length === 0) {
    return (
      <View style={{ padding: space.lg, gap: space.lg }}>
        <Empty>No days yet — this trip has no dates.</Empty>
        <Button
          label="Pick the dates"
          onPress={() => router.push(`/trip/${tripId}/dates`)}
        />
      </View>
    );
  }

  const dates = days.data.map((day) => day.date);
  // The trip's own today when it is running, else its first day. Neither is a
  // stored choice — both fall straight out of the dates that exist (rule 4).
  const now = today();
  const selected = chosen ?? (dates.includes(now) ? now : dates[0]);
  const day = days.data.find((row) => row.date === selected) ?? days.data[0];

  const stop = deriveStops(
    days.data.map((row) => ({
      dayId: row.id,
      date: row.date,
      overnightPlaceId: row.overnightPlaceId,
      overnightPlaceName: row.overnightPlaceName,
    })),
  ).find((run) => run.dayIds.includes(day.id));

  const busy = addEvent.isPending || updateEvent.isPending || deleteEvent.isPending;

  function save(draft: EventDraft) {
    if (editing.kind === "edit") {
      updateEvent.mutate({ tripId, eventId: editing.eventId, event: toInput(draft) });
      return;
    }
    addEvent.mutate({ tripId, dayId: day.id, event: toInput(draft) });
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingVertical: space.md }}>
        <DayStrip
          dates={dates}
          selected={selected}
          todayDate={now}
          onSelect={(date) => {
            setChosen(date);
            setEditing({ kind: "none" });
          }}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        <Label>{formatDate(day.date)}</Label>

        {stop?.placeName ? (
          <Pill word={`Overnight · ${stop.placeName}`} tone="mint" />
        ) : (
          <Body tone="ink-3">No overnight place set.</Body>
        )}

        {orderEvents(day.events).map((event) =>
          editing.kind === "edit" && editing.eventId === event.id ? (
            <EventForm
              key={event.id}
              initial={{
                type: event.type,
                title: event.title ?? "",
                time: event.time,
                allDay: event.allDay,
                note: event.note,
              }}
              busy={busy}
              problem={problem}
              onSave={save}
              onCancel={() => setEditing({ kind: "none" })}
              onDelete={() => deleteEvent.mutate({ tripId, eventId: event.id })}
            />
          ) : (
            <Pressable
              key={event.id}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${event.title ?? "this"}`}
              onPress={() => {
                setEditing({ kind: "edit", eventId: event.id });
                setProblem(null);
              }}
            >
              <Card>
                <Figure tone="ink-2">{event.allDay ? "All day" : (event.time ?? "—")}</Figure>
                <Body>{event.title}</Body>
                {event.note ? <Body tone="ink-2">{event.note}</Body> : null}
                {event.placeName ? <Body tone="ink-3">{event.placeName}</Body> : null}
              </Card>
            </Pressable>
          ),
        )}

        {day.events.length === 0 && editing.kind !== "add" ? (
          <Body tone="ink-3">Nothing planned for this day.</Body>
        ) : null}

        {editing.kind === "add" ? (
          <EventForm
            busy={busy}
            problem={problem}
            onSave={save}
            onCancel={() => setEditing({ kind: "none" })}
          />
        ) : (
          <Button
            label="Add to this day"
            variant="quiet"
            onPress={() => {
              setEditing({ kind: "add" });
              setProblem(null);
            }}
          />
        )}
      </ScrollView>
    </View>
  );
}
