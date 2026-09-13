import { addDays } from "@floc/core/dates/dates";
import { stayLinks, type BookingLink } from "@floc/core/trip/booking-links";
import { Linking, Text, View } from "react-native";

import { OutGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { Body, Button } from "../system/ui";
import { fonts, size, space } from "@/lib/theme";

export const OFFSITE_NOTE = "Opens another site. Floc isn't paid for these links.";

export function SiteLinks({ links }: { links: BookingLink[] }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
      {links.map((l) => (
        <Button
          key={l.site}
          label={l.site}
          variant="quiet"
          fit="small"
          icon={(ink) => <OutGlyph color={ink} />}
          onPress={() => void Linking.openURL(l.url)}
        />
      ))}
    </View>
  );
}

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
}: {
  place: string;
  start: string;
  end: string;
  adults: number;
}) {
  return (
    <View style={{ gap: space.sm }}>
      <Body bold>Find a stay</Body>
      <SiteLinks links={stayLinks({ place, checkIn: start, checkOut: addDays(end, 1), adults })} />
      <OffsiteNote />
    </View>
  );
}
