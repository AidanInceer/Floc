import type { BookingPlan } from "@floc/core/trip/booking/booking-links";
import { useState } from "react";
import { Text, View } from "react-native";

import { Card, Segmented, SectionTitle } from "../system/ui";
import { TextLink } from "../system/text-controls";
import { useTheme } from "../system/theme";
import { StayRows } from "./booking/stay-rows";
import { BookingSitesButton } from "./booking-sites-sheet";
import { SiteLinks } from "./site-links";
import { fonts, size, space } from "@/lib/theme";

const OFFSITE_NOTE = "Opens another site. Floc isn't paid for these links.";

function OffsiteNote({ centred }: { centred?: boolean }) {
  const { c } = useTheme();
  return (
    <Text style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.label, textAlign: centred ? "center" : "left" }}>
      {OFFSITE_NOTE}
    </Text>
  );
}

type Kind = "flights" | "stays";

const KINDS: { value: Kind; label: string }[] = [
  { value: "flights", label: "Flights" },
  { value: "stays", label: "Stays" },
];

export function BookingPanel({ tripId, plan, onOpenDays }: { tripId: number; plan: BookingPlan; onOpenDays: () => void }) {
  const [kind, setKind] = useState<Kind>("flights");

  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm }}>
        <SectionTitle>Get booking</SectionTitle>
        <BookingSitesButton />
      </View>
      <Segmented options={KINDS} value={kind} onChange={setKind} />
      {kind === "flights" ? (
        <Card>
          <SiteLinks kind="flights" links={plan.flights} centred />
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
