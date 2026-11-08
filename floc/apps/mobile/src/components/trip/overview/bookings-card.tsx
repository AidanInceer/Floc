// Why: the web's E2 Bookings card — one line a stop with an upload ring, and Whole trip as a grey footer band.
import { formatShortRange } from "@floc/core/dates/dates";
import type { DocCategory } from "@floc/core/documents/documents";
import type { Leg, LegFile } from "@floc/core/trip/overview/legs";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../system/theme";
import { SectionTitle } from "../../system/ui";
import { FileChip } from "./file-chip";
import { FileUpload } from "./file-upload";
import { fonts, radius, size, space } from "@/lib/theme";
import { shortPlace } from "@floc/core/itinerary/names/place-name";

type Named = LegFile & { id: number; name: string; category: DocCategory };


export function BookingsCard({
  tripId,
  legs,
  wholeTrip,
  onOpenFiles,
}: {
  tripId: number;
  legs: Leg<Named>[];
  wholeTrip: Named[];
  onOpenFiles: () => void;
}) {
  const { c } = useTheme();
  return (
    <View style={{ gap: space.sm }}>
      <SectionTitle>Bookings</SectionTitle>
      <View style={{ backgroundColor: c.sheet, borderColor: c.rule, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, overflow: "hidden" }}>
        {legs.map((leg, i) => (
          <View
            key={leg.no}
            style={{
              paddingHorizontal: space.lg,
              paddingVertical: space.md,
              gap: space.sm,
              borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
              borderTopColor: c.rule,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
              <Text style={{ width: 16, color: c.pen, fontFamily: fonts.type, fontSize: size.body, fontVariant: ["tabular-nums"] }}>{leg.no}</Text>
              <Text numberOfLines={1} style={{ flex: 1, color: c.ink, fontFamily: fonts.sansBold, fontSize: size.body }}>
                {shortPlace(leg.placeName)}
              </Text>
              <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.label, fontVariant: ["tabular-nums"] }}>
                {formatShortRange(leg.arrive, leg.leave)}
              </Text>
              <FileUpload tripId={tripId} dayId={leg.days[0].dayId} title={`Add a booking for ${shortPlace(leg.placeName)}`} filedUnder="hotel" />
            </View>
            {leg.files.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs, paddingLeft: 16 + space.md }}>
                {leg.files.map((f) => (
                  <FileChip key={f.id} category={f.category} text={f.name} onPress={onOpenFiles} />
                ))}
              </View>
            ) : null}
          </View>
        ))}
        <View
          accessibilityLabel="Whole trip"
          style={{
            gap: space.sm,
            paddingHorizontal: space.lg,
            paddingVertical: space.md,
            minHeight: 52,
            justifyContent: "center",
            backgroundColor: c["sheet-2"],
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: c.rule,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: c.ink, fontFamily: fonts.sansBold, fontSize: size.small }}>Whole trip</Text>
            <FileUpload tripId={tripId} title="Add a file for the whole trip" filedUnder="other" />
          </View>
          {wholeTrip.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs }}>
              {wholeTrip.map((f) => (
                <FileChip key={f.id} category={f.category} text={f.name} onPress={onOpenFiles} />
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
