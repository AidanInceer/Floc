import { MAX_SITES, siteChoices, type SiteKind } from "@floc/core/trip/booking/booking-sites";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SlidersGlyph, TickGlyph } from "../system/glyphs";
import { Sheet } from "../system/sheet";
import { useTheme } from "../system/theme";
import { Body, Button, Heading } from "../system/ui";
import { useBookingSites } from "./booking-sites";
import { fonts, radius, size, space } from "@/lib/theme";

const KIND_TITLE: Record<SiteKind, string> = { flights: "Flights", stays: "Stays" };

export function BookingSitesButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button label="Booking sites" variant="quiet" fit="small" icon={(ink) => <SlidersGlyph color={ink} />} onPress={() => setOpen(true)} />
      <Sheet open={open} onClose={() => setOpen(false)} footer={<Button label="Done" onPress={() => setOpen(false)} />}>
        <View style={{ paddingHorizontal: space.lg, paddingBottom: space.sm }}>
          <Heading>Booking sites</Heading>
        </View>
        <KindChoices kind="flights" />
        <KindChoices kind="stays" />
      </Sheet>
    </>
  );
}

function KindChoices({ kind }: { kind: SiteKind }) {
  const { c } = useTheme();
  const { sites, toggle } = useBookingSites();
  return (
    <View style={{ paddingHorizontal: space.lg, paddingVertical: space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingBottom: space.xs }}>
        <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.sansBold, fontSize: size.small }}>{KIND_TITLE[kind]}</Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.sm }}>
          {sites[kind].length >= MAX_SITES ? <Text style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.label }}>Untick one to swap</Text> : null}
          <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.label }}>{`${sites[kind].length} of ${MAX_SITES}`}</Text>
        </View>
      </View>
      {siteChoices(sites, kind).map((line) => (
        <Pressable
          key={line.site}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: line.on, disabled: !line.can }}
          accessibilityLabel={line.why ? `${line.site} (${line.why.toLowerCase()})` : line.site}
          disabled={!line.can}
          onPress={() => toggle(kind, line.site)}
          style={({ pressed }) => ({ minHeight: 44, flexDirection: "row", alignItems: "center", gap: space.md, opacity: line.can && pressed ? 0.6 : 1 })}
        >
          <View
            style={{
              width: 24,
              height: 24,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radius.sm,
              borderWidth: 1,
              borderColor: line.on ? c.pen : c["rule-2"],
              backgroundColor: line.on ? c.pen : c.sheet,
            }}
          >
            {line.on ? <TickGlyph color={c.sheet} /> : null}
          </View>
          <Body>{line.site}</Body>
          <Text style={{ marginLeft: "auto", color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>{line.use}</Text>
        </Pressable>
      ))}
    </View>
  );
}
