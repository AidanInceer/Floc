// The web Overview's postcard, cut back. Why no name: the header above already says it; the stamp opens every edit.
import { countdownLabel, formatDateRange } from "@floc/core/dates/dates";
import { tripListStage } from "@floc/core/trip/list-stage";
import { pastelOf } from "@floc/core/design/pastels";
import { positionLines, type Position } from "@floc/core/money/position";
import { readTags } from "@floc/core/trip/tags";
import { readTripMark } from "@floc/core/trip/mark/trip-mark";
import { readTripColor, tripPastel } from "@floc/core/trip/trip-color";
import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Face } from "../system/face-stack";
import { useTheme } from "../system/theme";
import { PenGlyph } from "../system/glyphs";
import { Pill } from "../system/ui";
import { LineRow } from "./overview/line-row";
import { TagPills } from "./tag-pills";
import { StampSheet } from "./stamp/stamp-sheet";
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
  members: Face[];
};

export function OverviewCard({
  trip,
  nights,
  position,
  onEdit,
  onDates,
  children,
  files,
  recap,
  onMoney,
}: {
  trip: CardTrip;
  nights: number;
  /** Where the viewer stands with the group; null while nothing is logged. */
  position: Position | null;
  onEdit: () => void;
  onDates: () => void;
  /** The group and Files lines, drawn by the screen so each loads on its own. */
  children?: ReactNode;
  files?: ReactNode;
  /** The recap foot, once the end date has passed (#443). */
  recap?: ReactNode;
  onMoney: () => void;
}) {
  const { c } = useTheme();
  const [picking, setPicking] = useState(false);
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
        paddingBottom: space.xs,
        borderRadius: radius.md,
        backgroundColor: c.sheet,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: c.rule,
        borderTopWidth: 6,
        borderTopColor: c[tone],
      }}
    >
      <Pressable
        testID="overview-stamp"
        accessibilityRole="button"
        accessibilityLabel="Colour and mark"
        onPress={() => setPicking(true)}
        hitSlop={space.sm}
        style={({ pressed }) => ({
          position: "absolute",
          top: space.md,
          right: space.md,
          zIndex: 1,
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
        <View style={{ position: "absolute", right: -7, bottom: -7, width: 20, height: 20, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: c.sheet, borderWidth: StyleSheet.hairlineWidth, borderColor: c.rule, transform: [{ rotate: "-4deg" }] }}>
          <PenGlyph color={c["ink-3"]} size={11} />
        </View>
      </Pressable>
      <StampSheet open={picking} onClose={() => setPicking(false)} tripId={trip.id} color={tripPastel(color, trip.id)} mark={mark} />

      {trip.archived && soon ? <Pill word="Archived" tone="pastel-yellow" /> : null}

      <Headline soon={soon} archived={trip.archived} trip={trip} />
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

      <View style={{ marginTop: space.xs }}>
        <TagsLine trip={trip} color={color} onEdit={onEdit} />
      </View>

      <View style={{ marginTop: space.sm }}>
        {position ? (
          positionLines(position).map((line) => <Line key={line.label} label={line.label} figure={line.figure} onPress={onMoney} />)
        ) : (
          <Line label="Nothing spent yet" onPress={onMoney} />
        )}
        {children}
        {files}
        {recap}
      </View>
    </View>
  );
}

function Headline({ soon, archived, trip }: { soon: string | null; archived: boolean; trip: CardTrip }) {
  const { c } = useTheme();
  const style = { fontFamily: fonts.displayBold, fontSize: size.display - 4, paddingRight: 72, minHeight: 62 } as const;
  if (soon) return <Text style={{ ...style, color: c["pastel-blue-ink"] }}>{soon.charAt(0).toUpperCase() + soon.slice(1)}</Text>;
  return <Text style={{ ...style, color: c.ink }}>{archived ? "Archived" : trip.startDate ? tripListStage(trip) : "When?"}</Text>;
}

function TagsLine({ trip, color, onEdit }: { trip: CardTrip; color: ReturnType<typeof readTripColor>; onEdit: () => void }) {
  const { c } = useTheme();
  if (readTags(trip.tags).length > 0) return <TagPills tags={trip.tags} color={color} tripId={trip.id} />;
  return (
    <Pressable accessibilityRole="button" onPress={onEdit} hitSlop={8} style={{ alignSelf: "flex-start", paddingVertical: space.xs }}>
      <Text style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>+ Add a tag</Text>
    </Pressable>
  );
}

function Line({ label, figure, onPress }: { label: string; figure?: string | null; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <LineRow label={figure ? `${label} ${figure}` : label} onPress={onPress} baseline={Boolean(figure)}>
      <Text
        style={{
          color: figure ? c["ink-3"] : label === "All square" ? c["pastel-green-ink"] : c["ink-3"],
          fontFamily: label === "All square" ? fonts.displayBold : fonts.sans,
          fontSize: label === "All square" ? size.body : size.small,
        }}
      >
        {label}
      </Text>
      {figure ? (
        <Text style={{ color: label === "You owe" ? c.ink : c["pastel-green-ink"], fontFamily: fonts.type, fontSize: size.body, fontVariant: ["tabular-nums"] }}>
          {figure}
        </Text>
      ) : null}
    </LineRow>
  );
}
