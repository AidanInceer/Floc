/**
 * The row of days across the top of the Days screen (ticket 298).
 *
 * DAY-FIRST, DRAWN (rule 3). This is the itinerary's spine: `day` rows in date
 * order, nothing derived and nothing stored about a "stop". The strip scrolls
 * sideways because a phone has one column and a trip has many days — the web
 * app can afford the whole list at once and does not need this.
 *
 * TODAY IS MARKED, NOT CENTRED ON. A trip that has not started has no today in
 * range, which is ordinary; nothing here treats that as a state (rule 4).
 */
import { Pressable, ScrollView, Text } from "react-native";

import { useTheme } from "../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

/** `2026-03-29` → `SUN`. Fixed English, and never the device's locale — see rule 10. */
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

function weekdayOf(date: string): string {
  // Noon UTC, so a date can never slide a day either way on the way through
  // `Date` — the one place this screen touches it at all (rule 10).
  return WEEKDAYS[new Date(`${date}T12:00:00Z`).getUTCDay()];
}

export function DayStrip({
  dates,
  selected,
  todayDate,
  onSelect,
}: {
  dates: string[];
  selected: string;
  /** The real today, passed in so the component itself reads no clock. */
  todayDate: string;
  onSelect: (date: string) => void;
}) {
  const { c } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.lg }}
    >
      {dates.map((date) => {
        const on = date === selected;
        const isToday = date === todayDate;
        return (
          <Pressable
            key={date}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={isToday ? `${date}, today` : date}
            onPress={() => onSelect(date)}
            style={{
              alignItems: "center",
              paddingVertical: space.sm,
              paddingHorizontal: space.md,
              borderRadius: radius.md,
              backgroundColor: on ? c.pen : c.sheet,
              borderWidth: 1,
              borderColor: isToday && !on ? c.pen : c.rule,
            }}
          >
            <Text
              style={{
                color: on ? c.paper : c["ink-3"],
                fontFamily: fonts.type,
                fontSize: size.label,
                letterSpacing: 0.6,
              }}
            >
              {weekdayOf(date)}
            </Text>
            <Text
              style={{
                color: on ? c.paper : c.ink,
                fontFamily: fonts.typeBold,
                fontSize: size.body,
                fontVariant: ["tabular-nums"],
              }}
            >
              {date.slice(8)}
            </Text>
            {/* The ring says "today" to the eye; this says it to everyone else (#204). */}
            {isToday ? (
              <Text
                style={{
                  color: on ? c.paper : c.pen,
                  fontFamily: fonts.type,
                  fontSize: size.label,
                }}
              >
                today
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
