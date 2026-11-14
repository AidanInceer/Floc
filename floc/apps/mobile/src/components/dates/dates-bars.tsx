// Why bars under the month: nothing writes until a press here, and each bar shows only once there is something to send.
import { formatDate } from "@floc/core/dates/dates";
import { compactRange } from "@floc/core/dates/dates-tabs";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { Button } from "../system/ui";
import type { DatesView } from "@/lib/dates/day-look";
import type { DateRange } from "@/lib/dates/range";
import { fonts, size, space } from "@/lib/theme";
import { countWord } from "@floc/core/text/count-word";

function Bar({ words, children }: { words: string; children: ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, paddingVertical: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule }}>
      <Text numberOfLines={2} style={{ flex: 1, color: c["ink-2"], fontFamily: fonts.type, fontSize: size.small, fontVariant: ["tabular-nums"] }}>
        {words}
      </Text>
      {children}
    </View>
  );
}

export function SaveBar({ changed, busy, onSave }: { changed: number; busy: boolean; onSave: () => void }) {
  return (
    <Bar words={`${countWord(changed, "change")} not saved`}>
      <Button label={`Save ${countWord(changed, "day")}`} fit="small" busy={busy} onPress={onSave} />
    </Bar>
  );
}

export function CommitBar({
  range,
  dated,
  busy,
  onCommit,
  onDiscard,
}: {
  range: DateRange;
  dated: boolean;
  busy: boolean;
  onCommit: () => void;
  onDiscard: () => void;
}) {
  const words = range.start === range.end ? formatDate(range.start, { weekday: false }) : compactRange(range.start, range.end);
  return (
    <Bar words={words}>
      <Button label="Discard" variant="quiet" fit="small" onPress={onDiscard} />
      <Button label={dated ? "Change dates" : "Set the dates"} fit="small" busy={busy} onPress={onCommit} />
    </Bar>
  );
}

/** The one bar the open view needs, if any. */
export function DatesBars(p: {
  view: DatesView;
  unsaved: number;
  range: DateRange | null;
  dated: boolean;
  busy: { marks: boolean; window: boolean };
  onSave: () => void;
  onCommit: () => void;
  onDiscard: () => void;
}) {
  if (p.view === "mine" && p.unsaved > 0) return <SaveBar changed={p.unsaved} busy={p.busy.marks} onSave={p.onSave} />;
  if (p.view === "trip" && p.range)
    return <CommitBar range={p.range} dated={p.dated} busy={p.busy.window} onCommit={p.onCommit} onDiscard={p.onDiscard} />;
  return null;
}