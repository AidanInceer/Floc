import { addDays } from "@floc/core/dates/dates";
import { stayLinks } from "@floc/core/trip/booking-links";
import { Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { Body } from "../system/ui";
import { SiteLinks } from "./site-links";
import { fonts, size, space } from "@/lib/theme";

const OFFSITE_NOTE = "Opens another site. Floc isn't paid for these links.";

export function OffsiteNote() {
  const { c } = useTheme();
  return (
    <Text style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.label }}>
      {OFFSITE_NOTE}
    </Text>
  );
}

/** One stay's search, for the nights `start`..`end` — check-out is the morning after. */
export function FindAStay({
  place,
  start,
  end,
  adults,
  prefill,
}: {
  place: string;
  start: string;
  end: string;
  adults: number;
  prefill: boolean;
}) {
  return (
    <View style={{ gap: space.sm }}>
      <Body bold>Find a stay</Body>
      <SiteLinks kind="stays" label={`Find a stay in ${place}`} links={stayLinks({ place, checkIn: start, checkOut: addDays(end, 1), adults, prefill })} />
      <OffsiteNote />
    </View>
  );
}
