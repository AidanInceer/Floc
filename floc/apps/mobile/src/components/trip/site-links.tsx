import { MAX_SITES, SITE_USE, canToggleSite, splitBySites, type SiteKind } from "@floc/core/trip/booking/booking-sites";
import type { BookingLink } from "@floc/core/trip/booking/booking-links";
import { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";

import { Sheet } from "../system/sheet";
import { ChevronGlyph, OutGlyph, TickGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { Body, Button, Heading, IconButton } from "../system/ui";
import { useBookingSites } from "./booking-sites";
import { fonts, radius, size, space } from "@/lib/theme";

/** Your sites as buttons, and every other site in a sheet behind the chevron (wireframe/booking-sites J). */
export function SiteLinks({ kind, links, label, centred }: { kind: SiteKind; links: BookingLink[]; label: string; centred?: boolean }) {
  const { sites } = useBookingSites();
  const [open, setOpen] = useState(false);
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
      <IconButton label={`More sites: ${label}`} onPress={() => setOpen(true)}>
        {(ink) => <ChevronGlyph color={ink} />}
      </IconButton>
      <Sheet open={open} onClose={() => setOpen(false)}>
        <View style={{ paddingHorizontal: space.lg, paddingBottom: space.sm }}>
          <Heading>{label}</Heading>
        </View>
        <SiteList kind={kind} links={links} />
      </Sheet>
    </View>
  );
}

function SiteList({ kind, links }: { kind: SiteKind; links: BookingLink[] }) {
  const { sites } = useBookingSites();
  const { mine, more } = splitBySites(links, sites[kind]);
  return (
    <View style={{ paddingHorizontal: space.lg, gap: space.xs }}>
      <Group count={`${mine.length} of ${MAX_SITES}`}>Your sites</Group>
      {mine.map((l) => <SiteRow key={l.site} kind={kind} link={l} />)}
      {more.length ? <Group>More sites</Group> : null}
      {more.map((l) => <SiteRow key={l.site} kind={kind} link={l} use />)}
    </View>
  );
}

function Group({ children, count }: { children: string; count?: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingTop: space.sm }}>
      <Text style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>{children}</Text>
      {count ? <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.label }}>{count}</Text> : null}
    </View>
  );
}

function SiteRow({ kind, link, use }: { kind: SiteKind; link: BookingLink; use?: boolean }) {
  const { c } = useTheme();
  const { sites, toggle } = useBookingSites();
  const on = (sites[kind] as string[]).includes(link.site);
  const can = canToggleSite(sites, kind, link.site);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${link.site} (opens another site)`}
        onPress={() => void Linking.openURL(link.url)}
        style={({ pressed }) => ({ flex: 1, minHeight: 44, flexDirection: "row", alignItems: "center", gap: space.sm, paddingVertical: space.sm, opacity: pressed ? 0.6 : 1 })}
      >
        <OutGlyph color={c["ink-2"]} />
        <Body>{link.site}</Body>
        {use ? <Text style={{ marginLeft: "auto", color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>{SITE_USE[link.site]}</Text> : null}
      </Pressable>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: on, disabled: !can }}
        accessibilityLabel={(on ? `Drop ${link.site} from your sites` : `Add ${link.site} to your sites`) + (can ? "" : on ? " (keep at least one)" : ` (up to ${MAX_SITES})`)}
        disabled={!can}
        hitSlop={6}
        onPress={() => toggle(kind, link.site)}
        style={{
          width: 34,
          height: 34,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: on ? c.pen : c["rule-2"],
          backgroundColor: on ? c.pen : c.sheet,
          opacity: can ? 1 : 0.4,
        }}
      >
        {on ? <TickGlyph color={c.sheet} /> : null}
      </Pressable>
    </View>
  );
}
