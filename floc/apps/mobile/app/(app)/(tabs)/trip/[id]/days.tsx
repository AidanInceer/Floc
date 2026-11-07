/**
 * Days (#298), one day at a time; a stop is derived from the days, never stored (rule 3), and times
 * stay local to the trip (rule 10). Why an Add event button as well as a press on an hour: nobody
 * found the hour, so an empty day looked read-only.
 */
import { today } from "@floc/core/dates/dates";
import { formatDate } from "@floc/core/dates/dates";
import { orderEvents } from "@floc/core/itinerary/event-order";
import type { DayEventType } from "@floc/core/vocabulary";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AddToCalendar } from "@/components/days/add-to-calendar";
import { DayGrid } from "@/components/days/day-grid";
import { EventOpen } from "@/components/days/event-open";
import { EventSheet } from "@/components/days/event-sheet";
import { DayStrip } from "@/components/days/day-strip";
import { EventForm, type EventDraft } from "@/components/days/event-form";
import { OvernightLine } from "@/components/days/overnight-line";
import { Button, Empty, Failed, Loading } from "@/components/system/ui";
import { PlusGlyph } from "@/components/system/glyphs";
import { useTheme } from "@/components/system/theme";
import { useSession } from "@/lib/auth";
import { openingDay } from "@/lib/days/opening-day";
import { trpc } from "@/lib/api";
import { fonts, size, space } from "@/lib/theme";

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
type Editing =
  | { kind: "none" }
  | { kind: "add"; time: string }
  | { kind: "edit"; eventId: number };

export default function Days() {
  const { id, date } = useLocalSearchParams<{ id: string; date?: string }>();
  const tripId = Number(id);
  // A screen keeps rendering for a frame while it leaves, and `id` is gone by
  // then: NaN goes down the wire as null and the server rightly refuses it.
  const ready = Number.isFinite(tripId);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { c } = useTheme();

  const [editing, setEditing] = useState<Editing>({ kind: "none" });
  const [problem, setProblem] = useState<string | null>(null);

  const days = useQuery(trpc.itinerary.days.queryOptions({ tripId }, { enabled: ready }));
  // One read for every block's clip (#324), not one per event. A trip with no
  // file store answers with an error the marker simply does without.
  const files = useQuery(trpc.files.list.queryOptions({ tripId }, { enabled: ready }));

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
  const now = today();
  // Why: the chosen day lives in the route, so a tap on Overview's track lands
  // here even when this tab is already mounted.
  const selected = openingDay(dates, date, now);
  const day = days.data.find((row) => row.date === selected) ?? days.data[0];

  const busy = addEvent.isPending || updateEvent.isPending || deleteEvent.isPending;
  const viewerId = session?.user.id;

  // Every event with a live file on it, across the whole trip — so the strip
  // can move to another day without a second read.
  const clipped = new Set((files.data ?? []).flatMap((file) => file.dayEventId ?? []));

  function save(draft: EventDraft) {
    if (editing.kind === "edit") {
      updateEvent.mutate({ tripId, eventId: editing.eventId, event: toInput(draft) });
      return;
    }
    addEvent.mutate({ tripId, dayId: day.id, event: toInput(draft) });
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingTop: space.sm }}>
        <DayStrip
          days={days.data}
          selected={selected}
          todayDate={now}
          onSelect={(picked) => {
            router.setParams({ date: picked });
            setEditing({ kind: "none" });
          }}
        />
      </View>

      {/* The head of the day stays put and the grid scrolls under it, so the date and the night stay in view. */}
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.sm, gap: space.xs, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: c.ink, fontFamily: fonts.sansBold, fontSize: size.body }}>{formatDate(day.date)}</Text>
            <Text numberOfLines={1} style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.small, fontVariant: ["tabular-nums"] }}>
              {`Day ${dates.indexOf(day.date) + 1} of ${dates.length} · ${day.events.length === 1 ? "1 event" : `${day.events.length} events`}`}
            </Text>
          </View>
          <AddToCalendar tripId={tripId} />
          <Button
            label="Add"
            fit="small"
            icon={(ink) => <PlusGlyph color={ink} />}
            onPress={() => {
              setEditing({ kind: "add", time: "" });
              setProblem(null);
            }}
          />
        </View>
        <OvernightLine tripId={tripId} days={days.data} date={day.date} />
      </View>

      <View style={{ flex: 1, paddingHorizontal: space.lg, paddingTop: space.md }}>
        <DayGrid
          events={orderEvents(day.events)}
          withFiles={clipped}
          onPick={(eventId) => {
            setEditing({ kind: "edit", eventId });
            setProblem(null);
          }}
          onAddAt={(time) => {
            setEditing({ kind: "add", time });
            setProblem(null);
          }}

        />
      </View>
      <EventSheet
        open={editing.kind === "add"}
        title="Add to this day"
        onClose={() => setEditing({ kind: "none" })}
      >
        <EventForm
          initial={{
            type: "activity",
            title: "",
            time: editing.kind === "add" && editing.time !== "" ? editing.time : null,
            allDay: false,
            note: null,
          }}
          busy={busy}
          problem={problem}
          onSave={save}
        />
      </EventSheet>

      {editing.kind === "edit" && viewerId ? (
        <EventOpen
          events={day.events}
          eventId={editing.eventId}
          tripId={tripId}
          viewerId={viewerId}
          busy={busy}
          problem={problem}
          onSave={save}
          onDelete={(eventId) => deleteEvent.mutate({ tripId, eventId })}
          onClose={() => setEditing({ kind: "none" })}
        />
      ) : null}
    </View>
  );
}
