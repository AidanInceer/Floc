/**
 * Explore — the map and a deck of its listings, then every trip as rows on one sheet. Filters and
 * the order open in sheets. The listings are static `@floc/core` data; only the finder and starting
 * a trip reach the server.
 */
import { EMPTY_FINDER, finderCounts, type Finder } from "@floc/core/trip/explore/finder/finder";
import { rankTrips, type FinderSort } from "@floc/core/trip/explore/finder/finder-rank";
import { finderPills } from "@floc/core/trip/explore/finder/finder-words";
import { listingPrice } from "@floc/core/trip/explore/listing-price";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { countryName, readCountryCode } from "@floc/core/people/countries";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { CopySheet } from "@/components/explore/copy-sheet";
import { ExploreDeck } from "@/components/explore/explore-deck";
import { ExploreMap, MAP_PICKS } from "@/components/explore/explore-map";
import { FinderBar } from "@/components/explore/finder/finder-bar";
import { FinderSheet } from "@/components/explore/finder/finder-sheet";
import { ListingRow } from "@/components/explore/listing-row";
import { useTheme } from "@/components/system/theme";
import { Body, Empty, Heading, SearchField } from "@/components/system/ui";
import { TextLink } from "@/components/system/text-controls";
import { trpc } from "@/lib/api";
import { fonts, radius, size, space } from "@/lib/theme";

const ROW_LIMIT = 10;

export default function Explore() {
  const router = useRouter();
  const { c } = useTheme();
  const pendingSave = useRef<ReturnType<typeof setTimeout>>(undefined);

  const state = useQuery(trpc.explore.get.queryOptions());
  const saves = useQuery(trpc.explore.saves.queryOptions());
  const [picked, setPicked] = useState(MAP_PICKS[0].id);
  // Why: a want-to-go country on Lists opens Explore searched for it (#467), over the remembered finder.
  const asked = readCountryCode(useLocalSearchParams<{ country?: string }>().country);
  const [finder, setFinder] = useState<Finder>(asked ? { ...EMPTY_FINDER, q: countryName(asked) } : EMPTY_FINDER);
  const [sort, setSort] = useState<FinderSort>("match");
  const [sheet, setSheet] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (asked) setFinder({ ...EMPTY_FINDER, q: countryName(asked) });
    else if (state.data?.finder) setFinder(state.data.finder);
  }, [asked, state.data?.finder]);

  const remember = useMutation(trpc.explore.setFinder.mutationOptions());
  const start = useMutation({
    ...trpc.trips.startFromPreset.mutationOptions(),
    onSuccess: (result) => {
      if (!result) return;
      setCopying(false);
      router.push({ pathname: "/trip/[id]", params: { id: result.id } });
    },
  });

  const trip = PRESET_TRIPS.find((t) => t.id === picked) ?? PRESET_TRIPS[0];
  // Why: saved trips are read when the list loads or the finder or sort changes, never on a heart press, so the list holds still.
  const rows = useMemo(() => rankTrips(PRESET_TRIPS, finder, sort, null, new Set(saves.data ?? [])), [finder, sort, saves.isSuccess]);
  const counts = useMemo(() => finderCounts(PRESET_TRIPS, finder), [finder]);
  const pills = finderPills(finder, state.data?.rates ?? null);
  const shown = showAll ? rows : rows.slice(0, ROW_LIMIT);

  const change = (next: Finder) => {
    setFinder(next);
    setShowAll(false);
    // Why: a dragged thumb fires on every step; save the last one only.
    clearTimeout(pendingSave.current);
    pendingSave.current = setTimeout(() => remember.mutate(next), 400);
  };
  const open = (id: string) => router.push({ pathname: "/explore/[preset]", params: { preset: id } });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.paper }}
      contentContainerStyle={{ paddingVertical: space.lg, gap: space.xl }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ gap: space.md }}>
        <View style={{ paddingHorizontal: space.lg }}>
          <ExploreMap picked={trip.id} onPick={setPicked} />
        </View>
        <ExploreDeck
          trips={MAP_PICKS}
          picked={trip.id}
          onPick={setPicked}
          starting={start.isPending}
          onStart={(id) => {
            setPicked(id);
            setCopying(true);
          }}
          onOpen={open}
        />
      </View>

      <View style={{ paddingHorizontal: space.lg, gap: space.md }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.sm }}>
          <Heading>All trips</Heading>
          <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.body }}>{rows.length}</Text>
        </View>
        <SearchField label="Search a place, country or tag" value={finder.q} onChangeText={(q) => change({ ...finder, q })} />
        <FinderBar
          set={pills.length + finder.likes.length}
          pills={pills.map((p) => ({ id: p.id, label: p.label, onClear: () => change(p.clear) }))}
          sort={sort}
          onSort={setSort}
          onOpen={() => setSheet(true)}
        />
        {rows.length === 0 ? (
          <Empty>No trip fits all of that. Remove a filter.</Empty>
        ) : (
          <View style={{ backgroundColor: c.sheet, borderColor: c.rule, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md }}>
            {shown.map((row, i) => (
              <ListingRow
                key={row.trip.id}
                trip={row.trip}
                figures={`${row.trip.nights} nights · from ${listingPrice(row.trip, state.data?.rates ?? null)}`}
                last={i === shown.length - 1}
                onOpen={() => open(row.trip.id)}
              />
            ))}
          </View>
        )}
        {rows.length > ROW_LIMIT ? (
          <TextLink label={showAll ? "Show fewer" : `Show ${rows.length - ROW_LIMIT} more`} onPress={() => setShowAll(!showAll)} />
        ) : null}
        <Body tone="ink-3">Ideas to start a trip from. Nothing is booked or paid for.</Body>
      </View>

      <CopySheet
        key={trip.id}
        trip={trip}
        open={copying}
        busy={start.isPending}
        error={start.isError ? start.error.message : null}
        onClose={() => setCopying(false)}
        onStart={(choice) => start.mutate(choice)}
      />
      <FinderSheet
        open={sheet}
        onClose={() => setSheet(false)}
        onClear={() => change(EMPTY_FINDER)}
        finder={finder}
        counts={counts}
        shown={rows.length}
        onChange={change}
      />
    </ScrollView>
  );
}
