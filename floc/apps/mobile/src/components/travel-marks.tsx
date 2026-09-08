/**
 * The travel map, as a phone can honestly draw it (ticket 95, #302).
 *
 * NOT THE WEB'S DRAWING, AND SAYS SO. The browser fills a Natural Earth
 * outline with Leaflet. Porting that means shipping the geojson, the
 * projection and a tap-test into the bundle for a section read once a month —
 * so this draws the same *data* as two named groups instead. Nothing is
 * hidden: every marked country is on screen, by name, which is more than the
 * world drawing manages at phone width anyway.
 *
 * READ-ONLY HERE. Marks come off the trips you are on, and the hand-painted
 * ones are edited on the web. The screen says where rather than going quiet
 * about the absence (#126).
 *
 * NAMED, NOT ONLY COLOURED (#204). Green and yellow carry no meaning on their
 * own, so each group has its heading and each country its word.
 */
import { countryName } from "@floc/core/countries";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "./theme";
import { Body, Label } from "./ui";
import { fonts, radius, size, space } from "@/lib/theme";

export type CountryMark = { code: string; state: "green" | "yellow" };

function Marks({ codes, tone }: { codes: string[]; tone: "mint" | "butter" }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs }}>
      {codes.map((code) => (
        <View
          key={code}
          style={{
            backgroundColor: c[tone],
            borderColor: c[`${tone}-edge`],
            borderWidth: StyleSheet.hairlineWidth,
            borderRadius: radius.pill,
            paddingVertical: 2,
            paddingHorizontal: space.sm,
          }}
        >
          <Text
            style={{ color: c[`${tone}-ink`], fontFamily: fonts.sans, fontSize: size.small }}
          >
            {countryName(code)}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function TravelMarks({ marks }: { marks: CountryMark[] }) {
  // Sorted by name so the same country sits in the same place between visits —
  // the wire order is whatever the map merge produced.
  const named = [...marks].sort((a, b) =>
    countryName(a.code).localeCompare(countryName(b.code), "en-GB"),
  );
  // Been is mint, want-to-go is butter — the same pairing the web uses.
  const been = named.filter((m) => m.state === "green").map((m) => m.code);
  const want = named.filter((m) => m.state === "yellow").map((m) => m.code);

  if (named.length === 0) {
    return <Body tone="ink-3">Nowhere marked yet. A trip that has ended puts its countries here.</Body>;
  }

  return (
    <View style={{ gap: space.md }}>
      {been.length > 0 ? (
        <View style={{ gap: space.xs }}>
          <Label>Been</Label>
          <Marks codes={been} tone="mint" />
        </View>
      ) : null}
      {want.length > 0 ? (
        <View style={{ gap: space.xs }}>
          <Label>Want to go</Label>
          <Marks codes={want} tone="butter" />
        </View>
      ) : null}
    </View>
  );
}
