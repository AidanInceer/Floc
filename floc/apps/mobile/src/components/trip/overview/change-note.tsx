import type { PlanChangeNote } from "@floc/api/port";
import { commentTime } from "@floc/core/notes/notes";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ChangeWords } from "../../notifications/change-words";
import { ChevronGlyph } from "../../system/glyphs";
import { useTheme } from "../../system/theme";
import { Button } from "../../system/ui";
import { trpc } from "@/lib/api";
import { fonts, radius, size, space } from "@/lib/theme";

const VERBS = { event_added: "added", event_moved: "moved", event_removed: "removed" } as const;
const TAGS = { event_added: "New", event_moved: "Moved", event_removed: "Removed" } as const;

export type StopMark = {
  id: number;
  date: string;
  eventId: number | null;
  tag: string;
  was: string | null;
  note: (onRow: boolean) => ReactNode;
};

function Turned({ direction, color }: { direction: "left" | "right"; color: string }) {
  return (
    <View style={{ transform: [{ rotate: direction === "left" ? "90deg" : "-90deg" }] }}>
      <ChevronGlyph color={color} />
    </View>
  );
}

function Step({ id, label, direction, onStep }: { id: number | null; label: string; direction: "left" | "right"; onStep: (id: number) => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: id === null }}
      disabled={id === null}
      hitSlop={space.sm}
      onPress={() => id !== null && onStep(id)}
      style={({ pressed }) => ({
        width: 31,
        height: 31,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius.sm,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: c["rule-2"],
        backgroundColor: c.sheet,
        opacity: id === null ? 0.45 : pressed ? 0.6 : 1,
      })}
    >
      <Turned direction={direction} color={c.ink} />
    </Pressable>
  );
}

function ChangeNote({ note, onRow, onStep, onDone, onInbox }: { note: PlanChangeNote; onRow: boolean; onStep: (id: number) => void; onDone: () => void; onInbox: () => void }) {
  const { c } = useTheme();
  const removed = note.kind === "event_removed";
  const named = removed || !onRow;
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{ gap: space.xs, padding: space.sm, borderRadius: radius.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: c["rule-2"], backgroundColor: c.sheet }}
    >
      <Text style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small }}>
        <Text style={{ color: c.ink, fontFamily: fonts.sansBold }}>{note.actor}</Text>
        {` ${VERBS[note.kind]} `}
        {removed ? <Text style={{ textDecorationLine: "line-through" }}>{note.title}</Text> : named ? note.title : "this"}
        {" "}
        <Text style={{ fontFamily: fonts.type }}>{commentTime(new Date(note.at))}</Text>
      </Text>
      {named ? <ChangeWords was={note.was} now={note.now} /> : null}
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
        <Pressable accessibilityRole="link" onPress={onInbox} hitSlop={space.md} style={{ flexDirection: "row", alignItems: "center", gap: space.xs, marginRight: "auto", paddingVertical: space.xs }}>
          <Turned direction="left" color={c["ink-2"]} />
          <Text style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small }}>Inbox</Text>
        </Pressable>
        <Text style={{ marginRight: space.xs, color: c["ink-2"], fontFamily: fonts.type, fontSize: size.label, fontVariant: ["tabular-nums"] }}>{`${note.index + 1} of ${note.total}`}</Text>
        <Step id={note.prevId} label="Previous change" direction="left" onStep={onStep} />
        {note.nextId === null ? (
          <Button label="Done" variant="quiet" fit="small" onPress={onDone} />
        ) : (
          <Step id={note.nextId} label="Next change" direction="right" onStep={onStep} />
        )}
      </View>
    </View>
  );
}

export function useStopMark(tripId: number, change: string | undefined): StopMark | null {
  const id = Number(change);
  const ready = Number.isFinite(tripId) && Number.isSafeInteger(id) && id > 0;
  const router = useRouter();
  const queryClient = useQueryClient();
  const note = useQuery(trpc.notifications.planNote.queryOptions({ tripId, id: ready ? id : 1 }, { enabled: ready, placeholderData: keepPreviousData }));
  const open = useMutation({
    ...trpc.notifications.open.mutationOptions(),
    onSuccess: (_href, input) => {
      void queryClient.invalidateQueries({ queryKey: trpc.notifications.pathKey() });
      router.setParams({ change: String(input.id) });
    },
  });
  if (!ready || !note.data) return null;
  const data = note.data;
  return {
    id: data.id,
    date: data.date,
    eventId: data.kind === "event_removed" ? null : data.eventId,
    tag: TAGS[data.kind],
    was: data.was,
    note: (onRow) => (
      <ChangeNote
        note={data}
        onRow={onRow}
        onStep={(step) => open.mutate({ id: step })}
        onDone={() => router.setParams({ change: "" })}
        onInbox={() => router.push("/inbox")}
      />
    ),
  };
}
