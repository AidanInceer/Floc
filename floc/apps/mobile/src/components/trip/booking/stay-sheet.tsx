import { formatShortRange } from "@floc/core/dates/dates";
import type { StayRow } from "@floc/core/trip/booking/booking-links";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { UploadGlyph } from "../../system/glyphs";
import { Sheet } from "../../system/sheet";
import { useTheme } from "../../system/theme";
import { Body, Heading, Pill } from "../../system/ui";
import { SiteList } from "../site-links";
import { fonts, size, space } from "@/lib/theme";

type Stop = Extract<StayRow, { kind: "stop" }>;

/** Where to look for a stay in one stop, and where to file the booking once you have it. */
export function StaySheet({ row, open, canUpload, onClose, onAdd }: { row: Stop; open: boolean; canUpload: boolean; onClose: () => void; onAdd: () => void }) {
  const { c } = useTheme();
  return (
    <Sheet open={open} onClose={onClose}>
      <View style={{ paddingHorizontal: space.lg, paddingBottom: space.sm, gap: 2 }}>
        <Heading>{row.hotel ? row.placeName : `Find a stay in ${row.placeName}`}</Heading>
        <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.label }}>{formatShortRange(row.checkIn, row.checkOut)}</Text>
      </View>
      {row.hotel ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.sm }}>
          <Text numberOfLines={2} style={{ flexShrink: 1, color: c.ink, fontFamily: fonts.sansBold, fontSize: size.body }}>{row.hotel.name}</Text>
          <Pill word="Booked" tone="pastel-green" />
        </View>
      ) : (
        <SiteList kind="stays" links={row.links} />
      )}
      {canUpload ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAdd}
          style={({ pressed }) => ({
            marginHorizontal: space.lg,
            marginTop: space.sm,
            minHeight: 48,
            flexDirection: "row",
            alignItems: "center",
            gap: space.sm,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: c.rule,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <UploadGlyph color={c["ink-2"]} />
          <Body>Add a booking</Body>
        </Pressable>
      ) : null}
    </Sheet>
  );
}
