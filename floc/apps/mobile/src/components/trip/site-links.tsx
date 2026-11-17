import { SITE_USE, splitBySites, type SiteKind } from "@floc/core/trip/booking/booking-sites";
import type { BookingLink } from "@floc/core/trip/booking/booking-links";
import { Linking, Pressable, Text, View } from "react-native";

import { OutGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { Body, Button } from "../system/ui";
import { useBookingSites } from "./booking-sites";
import { fonts, size, space } from "@/lib/theme";

export function SiteLinks({ kind, links, centred }: { kind: SiteKind; links: BookingLink[]; centred?: boolean }) {
  const { sites } = useBookingSites();
  const { mine } = splitBySites(links, sites[kind]);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: centred ? "center" : "flex-start", gap: space.sm }}>
      {mine.map((l) => (
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

export function SiteList({ kind, links }: { kind: SiteKind; links: BookingLink[] }) {
  const { sites } = useBookingSites();
  const { mine, more } = splitBySites(links, sites[kind]);
  return (
    <View style={{ paddingHorizontal: space.lg, gap: space.xs }}>
      <Group>Your sites</Group>
      {mine.map((l) => <SiteRow key={l.site} link={l} />)}
      {more.length ? <Group>More sites</Group> : null}
      {more.map((l) => <SiteRow key={l.site} link={l} use />)}
    </View>
  );
}

function Group({ children }: { children: string }) {
  const { c } = useTheme();
  return <Text style={{ paddingTop: space.sm, color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>{children}</Text>;
}

function SiteRow({ link, use }: { link: BookingLink; use?: boolean }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${link.site} (opens another site)`}
      onPress={() => void Linking.openURL(link.url)}
      style={({ pressed }) => ({ minHeight: 44, flexDirection: "row", alignItems: "center", gap: space.sm, paddingVertical: space.sm, opacity: pressed ? 0.6 : 1 })}
    >
      <OutGlyph color={c["ink-2"]} />
      <Body>{link.site}</Body>
      {use ? <Text style={{ marginLeft: "auto", color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>{SITE_USE[link.site]}</Text> : null}
    </Pressable>
  );
}
