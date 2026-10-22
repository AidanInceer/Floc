/**
 * "Start this trip" on the phone (ADR-025): the web's copy sheet, from the
 * foot of the screen. Pick a best month or decide later, then what else comes
 * across. The write is the caller's — this only gathers the answer.
 */
import { formatDateRange, today } from "@floc/core/dates/dates";
import type { CopyChoice } from "@floc/core/trip/explore/copy/copy-choice";
import { startMonths } from "@floc/core/trip/explore/copy/start-months";
import { MONTH_SHORT } from "@floc/core/trip/explore/finder/finder-words";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Sheet } from "../system/sheet";
import { useTheme } from "../system/theme";
import { Body, Button, Heading, Label, Toggle } from "../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

function Chip({ on, label, sub, onPress }: { on: boolean; label: string; sub?: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={sub ? `${label} ${sub}` : label}
      onPress={onPress}
      style={{
        minWidth: 64,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: space.xs + 2,
        paddingHorizontal: space.sm,
        borderRadius: radius.sm,
        borderWidth: StyleSheet.hairlineWidth * 2,
        borderColor: on ? c.ink : c["rule-2"],
        backgroundColor: on ? c.ink : c.sheet,
      }}
    >
      <Text style={{ color: on ? c.paper : c.ink, fontFamily: fonts.sansBold, fontSize: size.small }}>{label}</Text>
      {sub ? <Text style={{ color: on ? c.paper : c["ink-3"], opacity: on ? 0.75 : 1, fontFamily: fonts.type, fontSize: size.label }}>{sub}</Text> : null}
    </Pressable>
  );
}

export function CopySheet({
  trip,
  open,
  busy,
  error,
  onClose,
  onStart,
}: {
  trip: PresetTrip;
  open: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onStart: (choice: CopyChoice) => void;
}) {
  const months = startMonths(trip, today());
  const [month, setMonth] = useState<number | null>(months[0]?.month ?? null);
  const [ideas, setIdeas] = useState(true);
  const [events, setEvents] = useState(true);
  const chosen = months.find((m) => m.month === month);

  return (
    <Sheet open={open} onClose={onClose}>
      <View style={{ paddingHorizontal: space.lg, gap: space.md }}>
        <Heading>Start this trip</Heading>
        <Label>Start on the 1st of</Label>
        <View accessibilityRole="radiogroup" style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {months.map((m) => (
            <Chip key={m.month} on={month === m.month} label={MONTH_SHORT[m.month - 1]} sub={String(m.year)} onPress={() => setMonth(m.month)} />
          ))}
          <Chip on={!chosen} label="Decide later" onPress={() => setMonth(null)} />
        </View>
        <Body tone="ink-2">
          {chosen
            ? `${formatDateRange(chosen.startDate, chosen.endDate)} · ${trip.nights} nights`
            : "No dates yet, so only the highlights come across. Days and events need dates."}
        </Body>
        <View>
          <Toggle label="Add ideas" hint="Other things to do at each stop, and other stops to swap in." value={ideas} onChange={setIdeas} disabled={!chosen} />
          <Toggle label="Add events to the calendar" hint="Each day's plan, with times." value={events} onChange={setEvents} disabled={!chosen} />
        </View>
        <Button label="Start trip" busy={busy} onPress={() => onStart({ presetId: trip.id, month: chosen?.month ?? null, ideas, events })} />
        {error ? <Body tone="red">{error}</Body> : null}
        <Body tone="ink-3">You can change all of it later. Nothing is booked.</Body>
      </View>
    </Sheet>
  );
}
