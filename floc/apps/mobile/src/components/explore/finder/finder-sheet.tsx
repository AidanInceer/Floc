import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { LengthFacet, LikeCloud, PriceFacet, WhenFacet, WhereFacet, type Facet } from "./finder-facets";
import { Sheet } from "../../system/sheet";
import { TextLink } from "../../system/text-controls";
import { useTheme } from "../../system/theme";
import { Button, Heading, Label } from "../../system/ui";
import { fonts, size, space } from "@/lib/theme";

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: space.md, paddingVertical: space.md, borderBottomColor: c.rule, borderBottomWidth: 1 }}>
      <Text style={{ color: c.ink, fontFamily: fonts.sansBold, fontSize: size.body }}>{title}</Text>
      {children}
    </View>
  );
}

function Group({ children }: { children: string }) {
  const { c } = useTheme();
  return (
    <View style={{ marginTop: space.md, paddingTop: space.md, borderTopColor: c.ink, borderTopWidth: 1 }}>
      <Label>{children}</Label>
    </View>
  );
}

/** The web's filter rail, as a sheet: what must fit, then what you like. Folds are cut: a phone scrolls. */
export function FinderSheet({ open, onClose, onClear, ...facet }: Facet & { open: boolean; onClose: () => void; onClear: () => void }) {
  return (
    <Sheet open={open} onClose={onClose}>
      <View style={{ paddingHorizontal: space.lg, paddingBottom: space.md }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Heading>Filters</Heading>
          <TextLink label="Clear all" onPress={onClear} />
        </View>
        <Group>Must fit</Group>
        <Section title="Where">
          <WhereFacet {...facet} />
        </Section>
        <Section title="When you can go">
          <WhenFacet {...facet} />
        </Section>
        <Section title="How long">
          <LengthFacet {...facet} />
        </Section>
        <Section title="Price each">
          <PriceFacet {...facet} />
        </Section>
        <Group>What you like</Group>
        <View style={{ paddingVertical: space.md }}>
          <LikeCloud finder={facet.finder} onChange={facet.onChange} />
        </View>
        <Button label={`Show ${facet.shown} ${facet.shown === 1 ? "trip" : "trips"}`} onPress={onClose} />
      </View>
    </Sheet>
  );
}
