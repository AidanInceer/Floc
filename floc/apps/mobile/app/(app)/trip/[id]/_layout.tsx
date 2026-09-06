/**
 * One trip, one stack, one sheet (ticket 299).
 *
 * WHAT CHANGED AND WHY. This was five bottom tabs. Five is already more than a
 * tab bar reads well, and the day-first direction wants the bottom bar for the
 * app itself, not for one trip. So the sections moved into a sheet pulled up
 * from the header, and the screens became an ordinary stack — back goes back.
 *
 * MONEY KEEPS ITS OWN DOOR. The header carries the viewer's balance as a chip
 * that opens Money directly. That is not decoration: a drawer gets ignored,
 * and the one section people open daily should not depend on remembering the
 * drawer exists. It is also the test of this direction — see `section-sheet`.
 *
 * NOTHING HERE IS GATED (rule 4). Every route is reachable on any trip. Money
 * opens with no expenses, Days opens with no dates, and each says so itself.
 */
import { formatDateRange } from "@floc/core/dates";
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { SectionSheet, type Section } from "@/components/section-sheet";
import { useTheme } from "@/components/theme";
import { trpc } from "@/lib/api";
import { viewerBalance } from "@/lib/balance";
import { useSession } from "@/lib/auth";
import { fonts, radius, size, space } from "@/lib/theme";

/** The last path segment, which is the section — `""` for the trip's own index. */
function sectionOf(pathname: string, tripId: number): string {
  const tail = pathname.split(`/trip/${tripId}`)[1] ?? "";
  return tail.replace(/^\//, "");
}

function MenuButton({ onPress }: { onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Sections" onPress={onPress}>
      {/* Three rules, drawn as views: an SVG for three straight lines would be
          more machinery than the drawing needs. */}
      <View style={{ gap: 4, paddingHorizontal: space.sm }}>
        {[0, 1, 2].map((line) => (
          <View key={line} style={{ width: 18, height: 1.4, backgroundColor: c.ink }} />
        ))}
      </View>
    </Pressable>
  );
}

function BalanceChip({
  text,
  tone,
  onPress,
}: {
  text: string;
  tone: string;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Money, ${text}`} onPress={onPress}>
      <View
        style={{
          backgroundColor: c[tone],
          borderRadius: radius.pill,
          paddingVertical: space.xs,
          paddingHorizontal: space.sm,
        }}
      >
        <Text
          style={{
            color: c[`${tone}-ink`],
            fontFamily: fonts.type,
            fontSize: size.small,
            fontVariant: ["tabular-nums"],
          }}
        >
          {text}
        </Text>
      </View>
    </Pressable>
  );
}

export default function TripLayout() {
  const { c } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const trip = useQuery(trpc.trips.get.queryOptions({ tripId }));
  const days = useQuery(trpc.itinerary.days.queryOptions({ tripId }));
  const ledger = useQuery(trpc.money.ledger.queryOptions({ tripId }));

  const balance = viewerBalance(ledger.data, session?.user.id);
  const moneyFigure = balance.figure;
  const owing = balance.minor < 0;

  const sections: Section[] = [
    { route: "", label: "Overview", figure: trip.data?.name ?? "—" },
    { route: "days", label: "Days", figure: days.data ? `${days.data.length} days` : "—" },
    {
      route: "dates",
      label: "Dates",
      figure: trip.data ? formatDateRange(trip.data.startDate, trip.data.endDate) : "—",
    },
    { route: "money", label: "Money", figure: moneyFigure, tone: owing ? "red" : undefined },
    { route: "notes", label: "Notes", figure: "everyone can write" },
    {
      route: "roster",
      label: "Who",
      figure: trip.data ? `${trip.data.members.length} people` : "—",
    },
  ];

  const go = (route: string) => {
    setOpen(false);
    router.navigate(`/(app)/trip/${tripId}/${route}` as never);
  };

  return (
    <>
      <Stack
        screenOptions={{
          title: trip.data?.name ?? "Trip",
          headerStyle: { backgroundColor: c.sheet },
          headerTintColor: c.ink,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: c.paper },
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <BalanceChip
                text={moneyFigure}
                tone={owing ? "blush" : "mint"}
                onPress={() => go("money")}
              />
              <MenuButton onPress={() => setOpen(true)} />
            </View>
          ),
        }}
      />
      <SectionSheet
        open={open}
        sections={sections}
        current={sectionOf(pathname, tripId)}
        onClose={() => setOpen(false)}
        onGo={go}
      />
    </>
  );
}
