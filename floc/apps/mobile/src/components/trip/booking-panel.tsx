import type { BookingPlan } from "@floc/core/trip/booking/booking-links";
import { useState } from "react";
import { View } from "react-native";

import { Card, Segmented, SectionTitle } from "../system/ui";
import { TextLink } from "../system/text-controls";
import { OffsiteNote } from "./booking-links";
import { StayRows } from "./booking/stay-rows";
import { SiteLinks } from "./site-links";
import { space } from "@/lib/theme";

type Kind = "flights" | "stays";

const KINDS: { value: Kind; label: string }[] = [
  { value: "flights", label: "Flights" },
  { value: "stays", label: "Stays" },
];

export function BookingPanel({ tripId, plan, onOpenDays }: { tripId: number; plan: BookingPlan; onOpenDays: () => void }) {
  const [kind, setKind] = useState<Kind>("flights");

  return (
    <View style={{ gap: space.sm }}>
      <SectionTitle>Get booking</SectionTitle>
      <Segmented options={KINDS} value={kind} onChange={setKind} />
      {kind === "flights" ? (
        <Card>
          <SiteLinks kind="flights" label="Search flights" links={plan.flights} centred />
        </Card>
      ) : plan.stays === "unset" ? (
        <Card>
          <TextLink label="Set where you sleep on Days to find a stay" onPress={onOpenDays} />
        </Card>
      ) : (
        <StayRows tripId={tripId} rows={plan.stays} onOpenDays={onOpenDays} />
      )}
      <OffsiteNote centred={kind === "flights"} />
    </View>
  );
}
