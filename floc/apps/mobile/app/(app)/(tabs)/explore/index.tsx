/**
 * Explore — the web's map, match and list, cut back to one scroll. The
 * listings are static `@floc/core` data; only the shortlist, the answers and
 * starting a trip reach the server.
 */
import {
  DEFAULT_ANSWERS,
  rankMatches,
  type ExploreAnswers,
} from "@floc/core/trip/explore/explore-match";
import { DEFAULT_EXPLORE_SORT, sortPresetTrips, type ExploreSort } from "@floc/core/trip/explore/explore-sort";
import { PRESET_TRIPS, type Region } from "@floc/core/trip/explore/preset-trips";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View } from "react-native";

import { ExploreCard } from "@/components/explore/explore-card";
import { ExploreMap } from "@/components/explore/explore-map";
import { ExploreMatches } from "@/components/explore/explore-matches";
import { ExploreQuiz } from "@/components/explore/explore-quiz";
import { SortChips } from "@/components/explore/sort-chips";
import { PresetRow } from "@/components/packing/preset-row";
import { RegionChips, type RegionChoice } from "@/components/map/region-chips";
import { useTheme } from "@/components/system/theme";
import { Body, Heading, TextLink } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

const AVAILABLE: Region[] = [...new Set(PRESET_TRIPS.map((trip) => trip.region))];
const MATCH_COUNT = 5;
const ROW_LIMIT = 10;

export default function Explore() {
  const router = useRouter();
  const { c } = useTheme();
  const queryClient = useQueryClient();
  const scroll = useRef<ScrollView>(null);
  const pendingSave = useRef<ReturnType<typeof setTimeout>>(undefined);

  const state = useQuery(trpc.explore.get.queryOptions());
  const saved = state.data?.saved ?? [];
  const [picked, setPicked] = useState(PRESET_TRIPS[0].id);
  const [answers, setAnswers] = useState<ExploreAnswers>(DEFAULT_ANSWERS);
  const [region, setRegion] = useState<RegionChoice>(null);
  const [showAll, setShowAll] = useState(false);
  const [sort, setSort] = useState<ExploreSort>(DEFAULT_EXPLORE_SORT);
  const rates = useQuery({ ...trpc.explore.rates.queryOptions(), enabled: sort === "price" });

  useEffect(() => {
    if (state.data?.answers) setAnswers(state.data.answers);
  }, [state.data?.answers]);

  const refetch = () => queryClient.invalidateQueries({ queryKey: trpc.explore.get.queryKey() });
  const save = useMutation({ ...trpc.explore.setSaved.mutationOptions(), onSuccess: refetch });
  const remember = useMutation(trpc.explore.setAnswers.mutationOptions());
  const start = useMutation({
    ...trpc.trips.startFromPreset.mutationOptions(),
    onSuccess: (result) => {
      if (result) router.push({ pathname: "/trip/[id]", params: { id: result.id } });
    },
  });

  const trip = PRESET_TRIPS.find((t) => t.id === picked) ?? PRESET_TRIPS[0];
  const matches = useMemo(() => rankMatches(PRESET_TRIPS, answers, MATCH_COUNT), [answers]);
  const listings = useMemo(
    () => sortPresetTrips(region === null ? PRESET_TRIPS : PRESET_TRIPS.filter((t) => t.region === region), sort, rates.data ?? null),
    [region, sort, rates.data],
  );

  const answer = (next: ExploreAnswers) => {
    setAnswers(next);
    // Why: taps on the stepper come fast; save the last one only.
    clearTimeout(pendingSave.current);
    pendingSave.current = setTimeout(() => remember.mutate(next), 400);
  };

  const pickFromMatch = (id: string) => {
    setPicked(id);
    scroll.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <ScrollView
      ref={scroll}
      style={{ flex: 1, backgroundColor: c.paper }}
      contentContainerStyle={{ paddingVertical: space.lg, gap: space.xl }}
    >
      <View style={{ paddingHorizontal: space.lg, gap: space.md }}>
        <ExploreMap picked={trip.id} onPick={setPicked} />
        <ExploreCard
          trip={trip}
          saved={saved}
          saving={save.isPending}
          starting={start.isPending}
          onStart={() => start.mutate({ presetId: trip.id })}
          onOpen={() => router.push({ pathname: "/explore/[preset]", params: { preset: trip.id } })}
          onToggleSave={() => save.mutate({ presetId: trip.id, saved: !saved.includes(trip.id) })}
        />
      </View>

      <View style={{ paddingHorizontal: space.lg, gap: space.md }}>
        <Heading>Find the one for your group</Heading>
        <ExploreQuiz answers={answers} onAnswer={answer} />
        <ExploreMatches matches={matches} onPick={pickFromMatch} />
      </View>

      <View style={{ gap: space.md }}>
        <View style={{ paddingHorizontal: space.lg }}>
          <Heading>All trips</Heading>
        </View>
        <RegionChips available={AVAILABLE} value={region} onChange={(next) => {
          setRegion(next);
          setShowAll(false);
        }} />
        <SortChips value={sort} onChange={setSort} />
        <View style={{ paddingHorizontal: space.lg, gap: space.sm }}>
          {(showAll ? listings : listings.slice(0, ROW_LIMIT)).map((item) => (
            <PresetRow
              key={item.id}
              trip={item}
              onOpen={() => router.push({ pathname: "/explore/[preset]", params: { preset: item.id } })}
            />
          ))}
          {listings.length > ROW_LIMIT ? (
            <TextLink
              label={showAll ? "Show fewer" : `Show ${listings.length - ROW_LIMIT} more`}
              onPress={() => setShowAll(!showAll)}
            />
          ) : null}
          <Body tone="ink-3">Ideas to start a trip from. Nothing is booked or paid for.</Body>
        </View>
      </View>
    </ScrollView>
  );
}
