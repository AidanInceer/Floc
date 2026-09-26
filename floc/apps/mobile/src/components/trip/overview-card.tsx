// The web Overview's postcard, cut back: the stamp and the name open the trip's sheet, where every edit lives.
import { countdownLabel, formatDateRange } from "@floc/core/dates/dates";
import { titleCase } from "@floc/core/text/title-case";
import { pastelOf } from "@floc/core/design/pastels";
import { formatMoney } from "@floc/core/money/money";
import type { SpendHeadline } from "@floc/core/money/spend";
import { readTripMark } from "@floc/core/trip/mark/trip-mark";
import { readTripColor, tripPastel } from "@floc/core/trip/trip-color";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { PenGlyph } from "../system/glyphs";
import { Pill } from "../system/ui";
import { TagPills } from "./tag-pills";
import { TripMarkIcon } from "./trip-mark";
import { fonts, radius, size, space } from "@/lib/theme";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

type CardTrip = {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
  colorKey: string | null;
  mark: string | null;
  tags: string[] | null;
  archived: boolean;
  members: unknown[];
};

export function OverviewCard({
  trip,
  nights,
  spend,
  onEdit,
  onDates,
  onGroup,
  onMoney,
}: {
  trip: CardTrip;
  nights: number;
  spend: SpendHeadline | null;
  onEdit: () => void;
  onDates: () => void;
  onGroup: () => void;
  onMoney: () => void;
}) {
  const { c } = useTheme();
  const color = readTripColor(trip.colorKey);
  const tone = pastelOf(tripPastel(color, trip.id));
  const mark = readTripMark(trip.mark);
  const soon = countdownLabel(trip.startDate);
  const [, month, day] = trip.startDate?.split("-") ?? [];

  return (
    <View
      style={{
        gap: space.xs,
        padding: space.lg,
        borderRadius: radius.lg,
        backgroundColor: c.sheet,
        borderWidth: 1,
        borderColor: c.rule,
        borderTopWidth: 6,
        borderTopColor: c[tone],
      }}
    >
      <Pressable
        testID="overview-stamp"
        accessibilityRole="button"
        accessibilityLabel="Colour, mark, name and tags"
        onPress={onEdit}
        style={({ pressed }) => ({
          position: "absolute",
          top: space.md,
          right: space.md,
          width: 54,
          height: 62,
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          borderRadius: 6,
          backgroundColor: c[tone],
          borderWidth: 2,
          borderStyle: "dotted",
          borderColor: c[`${tone}-edge`],
          opacity: pressed ? 0.7 : 1,
          transform: [{ rotate: "4deg" }],
        })}
      >
        {mark ? <TripMarkIcon mark={mark} color={c[`${tone}-ink`]} size={22} /> : null}
        {trip.startDate ? (
          <Text style={{ color: c[`${tone}-ink`], fontFamily: fonts.type, fontSize: 9, letterSpacing: 0.7 }}>
            {`${Number(day)} ${MONTHS[Number(month) - 1]}`}
          </Text>
        ) : null}
      </Pressable>

      <Pressable accessibilityRole="button" accessibilityLabel={`Rename ${trip.name}`} onPress={onEdit} style={{ paddingRight: 72 }}>
        <Text style={{ color: c.ink, fontFamily: fonts.displayBold, fontSize: size.display, lineHeight: 32 }}>
          {titleCase(trip.name)}
        </Text>
      </Pressable>
      {trip.archived ? <Pill word="Archived" tone="pastel-yellow" /> : null}

      <Pressable
        accessibilityRole="link"
        accessibilityLabel={trip.startDate ? "Change dates" : "Pick dates"}
        onPress={onDates}
        style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}
      >
        <Text style={{ color: c["ink-2"], fontFamily: fonts.type, fontSize: size.small }}>
          {trip.startDate
            ? `${formatDateRange(trip.startDate, trip.endDate)} · ${nights} ${nights === 1 ? "night" : "nights"}`
            : "Dates not set"}
        </Text>
        <PenGlyph color={c["ink-3"]} />
      </Pressable>
      {soon ? (
        <Text style={{ color: c["pastel-blue-ink"], fontFamily: fonts.display, fontSize: size.body }}>
          {soon.charAt(0).toUpperCase() + soon.slice(1)}
        </Text>
      ) : null}

      <View style={{ marginTop: space.xs }}>
        <TagPills tags={trip.tags} color={color} tripId={trip.id} />
      </View>

      <View style={{ marginTop: space.sm, borderTopWidth: 1, borderTopColor: c.rule }}>
        <Line label={`${trip.members.length} going`} onPress={onGroup} />
        <Line
          label={spend ? "spent" : "Nothing spent yet"}
          figure={spend ? formatMoney(spend.total, spend.currency) : null}
          onPress={onMoney}
        />
      </View>
    </View>
  );
}

function Line({ label, figure, onPress }: { label: string; figure?: string | null; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "baseline",
        gap: space.sm,
        paddingVertical: space.sm,
        borderBottomWidth: 1,
        borderBottomColor: c.rule,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      {figure ? (
        <Text style={{ color: c["pastel-green-ink"], fontFamily: fonts.display, fontSize: size.heading, fontVariant: ["tabular-nums"] }}>
          {figure}
        </Text>
      ) : null}
      <Text style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small }}>{label}</Text>
    </Pressable>
  );
}
