import { formatDate } from "@floc/core/dates/dates";
import { Pressable, ScrollView, Text } from "react-native";

import { useTheme } from "../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

type TrackDay = { id: number; date: string; overnightPlaceName: string | null };

/** The web Overview's day track, cut back: one card per day, a tap opens that day. */
export function DayTrack({ days, onOpen }: { days: TrackDay[]; onOpen: (date: string) => void }) {
  const { c } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
      {days.map((day) => (
        <Pressable
          key={day.id}
          testID={`day-track-${day.date}`}
          accessibilityRole="link"
          accessibilityLabel={`${formatDate(day.date)}${day.overnightPlaceName ? `, ${day.overnightPlaceName}` : ""}`}
          onPress={() => onOpen(day.date)}
          style={{
            minWidth: 112,
            gap: space.xs,
            padding: space.md,
            borderRadius: radius.md,
            backgroundColor: c.sheet,
            borderWidth: 1,
            borderColor: c.rule,
          }}
        >
          <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.label, letterSpacing: 0.6, textTransform: "uppercase" }}>
            {formatDate(day.date)}
          </Text>
          {day.overnightPlaceName ? (
            <Text style={{ color: c.ink, fontFamily: fonts.typeBold, fontSize: size.body }}>{day.overnightPlaceName}</Text>
          ) : null}
        </Pressable>
      ))}
    </ScrollView>
  );
}
