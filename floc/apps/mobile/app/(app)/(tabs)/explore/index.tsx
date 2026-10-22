/**
 * Explore — the web's map and finder, cut back to one scroll: the filters open
 * in a sheet, and the trips are rows. The listings are static `@floc/core`
 * data; only the finder and starting a trip reach the server.
 */
import { EMPTY_FINDER, finderCounts, type Finder } from "@floc/core/trip/explore/finder/finder";
import { rankTrips, type FinderSort } from "@floc/core/trip/explore/finder/finder-rank";
import { finderPills } from "@floc/core/trip/explore/finder/finder-words";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View } from "react-native";

import { CopySheet } from "@/components/explore/copy-sheet";
import { ExploreCard } from "@/components/explore/explore-card";
import { ExploreMap } from "@/components/explore/explore-map";
import { FinderBar } from "@/components/explore/finder/finder-bar";
import { FinderSheet } from "@/components/explore/finder/finder-sheet";
import { PresetRow } from "@/components/packing/preset-row";
import { useTheme } from "@/components/system/theme";
import { Body, Empty, Heading, SearchField } from "@/components/system/ui";
import { TextLink } from "@/components/system/text-controls";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

const ROW_LIMIT = 10;

export default function Explore() {
  const router = useRouter();
  const { c } = useTheme();
  const pendingSave = useRef<ReturnType<typeof setTimeout>>(undefined);

  const state = useQuery(trpc.explore.get.queryOptions());
  const [picked, setPicked] = useState(PRESET_TRIPS[0].id);
  const [finder, setFinder] = useState<Finder>(EMPTY_FINDER);
  const [sort, setSort] = useState<FinderSort>("match");
  const [sheet, setSheet] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (state.data?.finder) setFinder(state.data.finder);
  }, [state.data?.finder]);

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
  const rows = useMemo(() => rankTrips(PRESET_TRIPS, finder, sort, null), [finder, sort]);
  const counts = useMemo(() => finderCounts(PRESET_TRIPS, finder), [finder]);
  const pills = finderPills(finder);

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
      <View style={{ paddingHorizontal: space.lg, gap: space.md }}>
        <ExploreMap picked={trip.id} onPick={setPicked} />
        <ExploreCard
          trip={trip}
          starting={start.isPending}
          onStart={() => setCopying(true)}
          onOpen={() => open(trip.id)}
        />
      </View>

      <View style={{ gap: space.md }}>
        <View style={{ paddingHorizontal: space.lg, gap: space.md }}>
          <Heading>All trips</Heading>
          <SearchField placeholder="Search a place, country or tag" value={finder.q} onChangeText={(q) => change({ ...finder, q })} />
        </View>
        <FinderBar
          shown={rows.length}
          set={pills.length + finder.likes.length}
          pills={pills.map((p) => ({ id: p.id, label: p.label, onClear: () => change(p.clear) }))}
          sort={sort}
          onSort={setSort}
          onOpen={() => setSheet(true)}
        />
        <View style={{ paddingHorizontal: space.lg, gap: space.sm }}>
          {rows.length === 0 ? <Empty>No trip fits all of that. Remove a filter.</Empty> : null}
          {(showAll ? rows : rows.slice(0, ROW_LIMIT)).map((row) => (
            <PresetRow key={row.trip.id} trip={row.trip} note={row.hits.join(" · ")} onOpen={() => open(row.trip.id)} />
          ))}
          {rows.length > ROW_LIMIT ? (
            <TextLink label={showAll ? "Show fewer" : `Show ${rows.length - ROW_LIMIT} more`} onPress={() => setShowAll(!showAll)} />
          ) : null}
          <Body tone="ink-3">Ideas to start a trip from. Nothing is booked or paid for.</Body>
        </View>
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
