import { formatDateRange, nightsBetween } from "@floc/core/dates/dates";
import type { BookingPlan } from "@floc/core/trip/booking-links";
import { useState } from "react";
import { View } from "react-native";

import { useTheme } from "../system/theme";
import { Body, Card, Label, Segmented } from "../system/ui";
import { TextLink } from "../system/text-controls";
import { OffsiteNote, SiteLinks } from "./booking-links";
import { radius, space } from "@/lib/theme";

type Kind = "flights" | "stays";

const KINDS: { value: Kind; label: string }[] = [
  { value: "flights", label: "Flights" },
  { value: "stays", label: "Stays" },
];

function nightsLabel(checkIn: string, checkOut: string) {
  const n = nightsBetween(checkIn, checkOut);
  return `${n} ${n === 1 ? "night" : "nights"}`;
}

function GapRow({ dates, onOpenDays }: { dates: string; onOpenDays: () => void }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        gap: space.xs,
        padding: space.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: c.rule,
        backgroundColor: c["sheet-2"],
      }}
    >
      <Body tone="ink-3">No stop yet · {dates}</Body>
      <TextLink label="Set where you sleep on Days" onPress={onOpenDays} />
    </View>
  );
}

export function BookingPanel({ plan, onOpenDays }: { plan: BookingPlan; onOpenDays: () => void }) {
  const [kind, setKind] = useState<Kind>("flights");

  return (
    <View style={{ gap: space.sm }}>
      <Label>Get booking</Label>
      <Segmented options={KINDS} value={kind} onChange={setKind} />
      <Card>
        <View style={{ gap: space.md }}>
          {kind === "flights" ? <SiteLinks links={plan.flights} /> : null}

          {kind === "stays" && plan.stays === "unset" ? (
            <TextLink label="Set where you sleep on Days to find a stay" onPress={onOpenDays} />
          ) : null}

          {kind === "stays" && plan.stays !== "unset"
            ? plan.stays.map((row) =>
                row.kind === "stop" ? (
                  <View key={row.checkIn} style={{ gap: space.xs }}>
                    <Body bold>{row.placeName}</Body>
                    <Body tone="ink-3">
                      {formatDateRange(row.checkIn, row.checkOut)} · {nightsLabel(row.checkIn, row.checkOut)}
                    </Body>
                    <SiteLinks links={row.links} />
                  </View>
                ) : (
                  <GapRow
                    key={row.checkIn}
                    dates={formatDateRange(row.checkIn, row.checkOut)}
                    onOpenDays={onOpenDays}
                  />
                ),
              )
            : null}

          <OffsiteNote />
        </View>
      </Card>
    </View>
  );
}
