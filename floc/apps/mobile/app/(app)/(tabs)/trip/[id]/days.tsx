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

type Editing =
  | { kind: "none" }
  | { kind: "add"; time: string }
  | { kind: "edit"; eventId: number };

export default function Days() {
  const { id, date } = useLocalSearchParams<{ id: string; date?: string }>();
  const tripId = Number(id);
  const ready = Number.isFinite(tripId);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { c } = useTheme();

  const [editing, setEditing] = useState<Editing>({ kind: "none" });
  const [problem, setProblem] = useState<string | null>(null);
  const [overnightAt, setOvernightAt] = useState<string | null>(null);

  const days = useQuery(trpc.itinerary.days.queryOptions({ tripId }, { enabled: ready }));
  const tripEnd = useQuery(trpc.trips.get.queryOptions({ tripId }, { enabled: ready, select: (t) => t.endDate }));
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
  const selected = openingDay(dates, date, now);
  const day = days.data.find((row) => row.date === selected) ?? days.data[0];

  const busy = addEvent.isPending || updateEvent.isPending || deleteEvent.isPending;
  const viewerId = session?.user.id;

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
          tripEnd={tripEnd.data}
          onSelect={(picked) => {
            router.setParams({ date: picked });
            setEditing({ kind: "none" });
          }}
          onStop={setOvernightAt}
        />
      </View>

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
        <OvernightLine tripId={tripId} days={days.data} openAt={overnightAt} onClose={() => setOvernightAt(null)} />
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
