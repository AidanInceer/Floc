/**
 * Fill your days from Google Calendar on the phone (#444, ADR-031) — the web's choice, drawn
 * tighter: Google's own button, and "by hand" as words, since the grid is already its control.
 * The consent opens in the system browser and comes back through the app's scheme.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { View } from "react-native";

import { GoogleCalendarButton } from "@/components/auth/google-button";
import { PenGlyph, TickGlyph } from "@/components/system/glyphs";
import { useTheme } from "@/components/system/theme";
import { Body, Button } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { linkSocial } from "@/lib/auth";
import { space } from "@/lib/theme";
import { GOOGLE_CALENDAR_CONSENT } from "@floc/core/dates/calendar-import";

export type CalendarNote = { kind: "done"; free: number; busy: number } | { kind: "error"; message: string } | null;

const CALENDAR_REFUSED = "Google didn't give access. Nothing changed.";
const CALENDAR_FAILED = "Couldn't reach Google Calendar. Nothing changed.";
const LABEL = "Fill from Google Calendar";
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** What happened, in words: filled N, or why nothing was. */
export function CalendarResult({ note }: { note: CalendarNote }) {
  const { c } = useTheme();
  if (!note) return null;
  if (note.kind === "error") return <Body tone="red">{note.message}</Body>;
  const total = note.free + note.busy;
  if (total === 0) return <Body tone="ink-2">Every day is already marked</Body>;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
      <TickGlyph color={c.green} />
      <Body tone="ink-2">
        {`Filled ${plural(total, "day")} from Google Calendar${note.busy ? ` · ${note.busy} busy` : ""}`}
      </Body>
    </View>
  );
}

/** With no days marked: Google's button, then by hand as plain words. */
export function CalendarChoice({ busy, note, onFill }: { busy: boolean; note: CalendarNote; onFill: () => void }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: space.sm }}>
      <GoogleCalendarButton label={busy ? "Reading your calendar…" : LABEL} busy={busy} onPress={onFill} />
      {note?.kind === "error" ? <CalendarResult note={note} /> : null}
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space.sm }}>
        <View style={{ paddingTop: 2 }}>
          <PenGlyph color={c["ink-2"]} size={14} />
        </View>
        <View style={{ flex: 1 }}>
          <Body>Or mark them by hand</Body>
          <Body tone="ink-3">Drag across the days you can do</Body>
        </View>
      </View>
    </View>
  );
}

/** Once there are marks, the import is a quiet button under the grid. */
export function CalendarAgain({ busy, onFill }: { busy: boolean; onFill: () => void }) {
  return <Button label={busy ? "Reading your calendar…" : LABEL} variant="quiet" busy={busy} onPress={onFill} />;
}

/**
 * One read on the tap. First time Google has no access: the consent opens in the system browser,
 * and once the person is back it reads again. Offered only when the server has a Google key (rule 11).
 */
export function useCalendarFill(tripId: number) {
  const queryClient = useQueryClient();
  const access = useQuery(trpc.availability.calendar.queryOptions());
  const mutation = useMutation(trpc.availability.fillFromCalendar.mutationOptions());
  const [note, setNote] = useState<CalendarNote>(null);

  async function fill(month: string) {
    setNote(null);
    try {
      let result = await mutation.mutateAsync({ tripId, month });
      if (result.status === "needs-access") {
        const { error } = await linkSocial({ ...GOOGLE_CALENDAR_CONSENT, callbackURL: "/trips" });
        if (error) return setNote({ kind: "error", message: CALENDAR_REFUSED });
        result = await mutation.mutateAsync({ tripId, month });
      }
      if (result.status === "filled") setNote({ kind: "done", free: result.free, busy: result.busy });
      else setNote({ kind: "error", message: result.status === "error" ? result.message : CALENDAR_REFUSED });
      void queryClient.invalidateQueries({ queryKey: trpc.availability.list.queryKey({ tripId }) });
    } catch {
      setNote({ kind: "error", message: CALENDAR_FAILED });
    }
  }

  return { enabled: access.data?.enabled === true, busy: mutation.isPending, note, fill };
}

type Calendar = ReturnType<typeof useCalendarFill>;

/** Above the grid while you have no days: Google's button, and by hand as words. Rule 11: nothing with no Google key. */
export function CalendarTop({ cal, show, month }: { cal: Calendar; show: boolean; month: string }) {
  if (!show || !cal.enabled) return null;
  return <CalendarChoice busy={cal.busy} note={cal.note} onFill={() => cal.fill(month)} />;
}

/** Once there are days: a quiet button under the grid, and the line saying what happened. */
export function CalendarBelow({ cal, show, empty, month }: { cal: Calendar; show: boolean; empty: boolean; month: string }) {
  if (!show || !cal.enabled) return null;
  if (empty) return cal.note?.kind === "done" ? <CalendarResult note={cal.note} /> : null;
  return (
    <View style={{ gap: space.sm }}>
      <CalendarAgain busy={cal.busy} onFill={() => cal.fill(month)} />
      <CalendarResult note={cal.note} />
    </View>
  );
}
