import { dayParts, formatDate } from "@floc/core/dates/dates";
import { IDEA_TIMES } from "@floc/core/trip/ideas";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Sheet } from "../../system/sheet";
import { useTheme } from "../../system/theme";
import { Body, Button, Heading, Label } from "../../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

export type IdeaDay = { id: number; date: string; overnightPlaceName: string | null };

export function IdeaDaysSheet({
  title,
  days,
  busy,
  onClose,
  onDates,
  onAdd,
}: {
  title: string;
  days: IdeaDay[];
  busy: boolean;
  onClose: () => void;
  onDates: () => void;
  onAdd: (dayId: number, time: string | null, label: string, date: string) => void;
}) {
  const { c } = useTheme();
  const [dayId, setDayId] = useState<number | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const chosen = days.find((day) => day.id === dayId);
  const edge = (on: boolean) => ({
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: on ? c["pen-edge"] : c["rule-2"],
    backgroundColor: on ? c["pen-2"] : "transparent",
    borderRadius: radius.sm,
  });
  const ink = (on: boolean) => (on ? c["pen-deep"] : c["ink-2"]);

  return (
    <Sheet
      open
      onClose={onClose}
      footer={
        <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: space.sm, paddingHorizontal: space.lg, paddingTop: space.md }}>
          <Button label="Cancel" fit="small" variant="quiet" onPress={onClose} />
          {days.length > 0 ? (
            <Button label="Add to Days" fit="small" busy={busy} disabled={!chosen} onPress={() => chosen && onAdd(chosen.id, time, formatDate(chosen.date), chosen.date)} />
          ) : null}
        </View>
      }
    >
      <View style={{ paddingHorizontal: space.lg, gap: space.md }}>
        <Heading>{title}</Heading>
        {days.length === 0 ? (
          <View style={{ gap: space.sm, alignItems: "flex-start" }}>
            <Body tone="ink-2">This trip has no days yet.</Body>
            <Button label="Set the dates" fit="small" variant="quiet" onPress={onDates} />
          </View>
        ) : (
          <>
            <Label>Day</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.xs }}>
              {days.map((day) => {
                const on = day.id === dayId;
                const parts = dayParts(day.date);
                return (
                  <Pressable
                    key={day.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={formatDate(day.date)}
                    onPress={() => setDayId(day.id)}
                    style={[edge(on), { width: 58, alignItems: "center", paddingVertical: space.xs }]}
                  >
                    <Text style={{ color: ink(on), fontFamily: fonts.type, fontSize: size.label }}>{parts.weekday.toUpperCase()}</Text>
                    <Text style={{ color: on ? c["pen-deep"] : c.ink, fontFamily: fonts.type, fontSize: size.body }}>{parts.day}</Text>
                    {day.overnightPlaceName ? <Text numberOfLines={1} style={{ color: ink(on), fontFamily: fonts.sans, fontSize: size.label }}>{day.overnightPlaceName.split(",")[0]}</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Label>Time</Label>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs }}>
              {IDEA_TIMES.map((option) => {
                const on = option.time === time;
                return (
                  <Pressable
                    key={option.label}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={option.time ? `${option.label}, ${option.time}` : option.label}
                    onPress={() => setTime(option.time)}
                    style={[edge(on), { minHeight: 34, flexDirection: "row", alignItems: "center", gap: space.xs, paddingHorizontal: space.sm }]}
                  >
                    <Text style={{ color: ink(on), fontFamily: fonts.sans, fontSize: size.small }}>{option.label}</Text>
                    {option.time ? <Text style={{ color: ink(on), fontFamily: fonts.type, fontSize: size.label }}>{option.time}</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </View>
    </Sheet>
  );
}
