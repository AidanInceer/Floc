import { formatDateRange, formatShortRange, nightsBetween } from "@floc/core/dates/dates";
import type { StayRow } from "@floc/core/trip/booking/booking-links";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ChevronGlyph } from "../../system/glyphs";
import { TextLink } from "../../system/text-controls";
import { useTheme } from "../../system/theme";
import { Card, Pill } from "../../system/ui";
import { HotelUpload, useCanUpload } from "../hotel-upload";
import { StaySheet } from "./stay-sheet";
import { fonts, size, space } from "@/lib/theme";

type Stop = Extract<StayRow, { kind: "stop" }>;

function meta(row: StayRow) {
  const n = nightsBetween(row.checkIn, row.checkOut);
  return `${formatShortRange(row.checkIn, row.checkOut)} · ${n} ${n === 1 ? "night" : "nights"}`;
}

function StopRow({ tripId, row, first }: { tripId: number; row: Stop; first: boolean }) {
  const { c } = useTheme();
  const canUpload = useCanUpload(tripId);
  const [find, setFind] = useState(false);
  const [upload, setUpload] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={row.hotel ? `${row.placeName}, booked at ${row.hotel.name}` : `Find a stay in ${row.placeName}`}
        onPress={() => setFind(true)}
        style={({ pressed }) => ({
          minHeight: 56,
          flexDirection: "row",
          alignItems: "center",
          gap: space.md,
          paddingHorizontal: space.md,
          paddingVertical: space.sm,
          borderTopWidth: first ? 0 : StyleSheet.hairlineWidth,
          borderTopColor: c.rule,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text numberOfLines={2} style={{ color: c.ink, fontFamily: fonts.sansBold, fontSize: size.small }}>{row.placeName}</Text>
          <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.label, fontVariant: ["tabular-nums"] }}>{meta(row)}</Text>
          {row.hotel ? <Text numberOfLines={1} style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small }}>{row.hotel.name}</Text> : null}
        </View>
        {row.hotel ? (
          <Pill word="Booked" tone="pastel-green" />
        ) : (
          <Text style={{ color: c["pen-deep"], fontFamily: fonts.sansBold, fontSize: size.small }}>Find a stay</Text>
        )}
        <ChevronGlyph color={c["ink-3"]} />
      </Pressable>
      <StaySheet
        row={row}
        open={find}
        canUpload={canUpload}
        onClose={() => setFind(false)}
        onAdd={() => {
          setFind(false);
          // Why: iOS drops a Modal presented while another is still dismissing.
          timer.current = setTimeout(() => setUpload(true), 450);
        }}
      />
      <HotelUpload tripId={tripId} dayId={row.dayId} place={row.placeName} open={upload} onClose={() => setUpload(false)} />
    </>
  );
}

function GapRow({ row, first, onOpenDays }: { row: StayRow; first: boolean; onOpenDays: () => void }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        gap: space.xs,
        paddingHorizontal: space.md,
        paddingVertical: space.md,
        borderTopWidth: first ? 0 : StyleSheet.hairlineWidth,
        borderTopColor: c.rule,
        alignItems: "flex-start",
      }}
    >
      <Text style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>
        No stop yet · {formatDateRange(row.checkIn, row.checkOut)}
      </Text>
      <TextLink label="Set where you sleep on Days" onPress={onOpenDays} />
    </View>
  );
}

/** One card, one hairline row a stop (wireframe/booking-sites J). */
export function StayRows({ tripId, rows, onOpenDays }: { tripId: number; rows: StayRow[]; onOpenDays: () => void }) {
  return (
    <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
      {rows.map((row, i) =>
        row.kind === "stop" ? (
          <StopRow key={row.checkIn} tripId={tripId} row={row} first={i === 0} />
        ) : (
          <GapRow key={row.checkIn} row={row} first={i === 0} onOpenDays={onOpenDays} />
        ),
      )}
    </Card>
  );
}
