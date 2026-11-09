/**
 * Saved (#467, ADR-042): the Explore trips you saved, then the countries you want to go to, as rows.
 * A row opens the trip or Explore searched for the country; its Start trip button starts one from it.
 * A country is the globe's yellow, so adding or removing one here paints the globe too.
 */
import { wantToGoCountries } from "@floc/core/itinerary/travel-map";
import { COUNTRIES } from "@floc/core/people/countries";
import { listingsIn, regionOf } from "@floc/core/trip/explore/listing-countries";
import { PRESET_TRIPS, type PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { listingPrice } from "@floc/core/trip/explore/listing-price";
import { RegionTags } from "@/components/explore/region-tag";
import { useListingRates } from "@/components/explore/use-listing-rates";
import { HeartButton, useSavedTrips } from "@/components/explore/save-heart";
import { PlusGlyph } from "@/components/system/glyphs";
import { useTheme } from "@/components/system/theme";
import { Body, Button, Card, Failed, Loading, SearchField } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { fonts, radius, size, space } from "@/lib/theme";

type Country = { code: string; name: string };

const byId = new Map(PRESET_TRIPS.map((t) => [t.id, t]));

export function SavedPane() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const face = useQuery(trpc.me.profile.queryOptions());
  const { ids, pending, failed, retry, toggle } = useSavedTrips();
  const rates = useListingRates();
  const [filter, setFilter] = useState("");
  const profileKey = trpc.me.profile.queryKey();
  const mark = useMutation({
    ...trpc.me.setMark.mutationOptions(),
    // Why: the row goes or comes under the finger, as on the web; the refetch puts it right either way.
    onMutate: async ({ code, state }) => {
      await queryClient.cancelQueries({ queryKey: profileKey });
      queryClient.setQueryData(profileKey, (face) =>
        face ? { ...face, map: [...face.map.filter((m) => m.code !== code), ...(state === "blank" ? [] : [{ code, state }])] } : face,
      );
      return undefined;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: profileKey }),
  });

  if (face.isPending || pending) return <Loading />;
  if (face.isError || failed) return <Failed onRetry={() => (face.isError ? face.refetch() : retry())} />;

  const countries = wantToGoCountries({ states: Object.fromEntries(face.data.map.map((m) => [m.code, m.state])) });
  const trips = ids.map((id) => byId.get(id)).filter((t): t is PresetTrip => Boolean(t));
  const have = new Set(countries.map((c) => c.code));
  const needle = filter.trim().toLowerCase();
  const found = needle ? COUNTRIES.filter((c) => !have.has(c.code) && c.name.toLowerCase().includes(needle)).slice(0, 8) : [];

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }} keyboardShouldPersistTaps="handled">
      <View style={{ gap: space.sm }}>
        <SearchField label="Add a country" value={filter} onChangeText={setFilter} />
        {needle ? (
          <Card>
            {found.length === 0 ? <Body tone="ink-3">No country by that name.</Body> : null}
            {found.map((c) => (
              <AddRow
                key={c.code}
                name={c.name}
                onPress={() => {
                  setFilter("");
                  mark.mutate({ code: c.code, state: "yellow" });
                }}
              />
            ))}
          </Card>
        ) : null}
      </View>

      {trips.length + countries.length === 0 ? (
        <View style={{ alignItems: "center", paddingVertical: space.xl }}>
          <Button label="Find a trip on Explore" fit="small" onPress={() => router.push("/explore")} />
        </View>
      ) : (
        <Card style={{ padding: 0, gap: 0 }}>
          {trips.map((trip, i) => (
            <SavedRow
              key={trip.id}
              first={i === 0}
              tags={<RegionTags region={trip.region} countries={trip.country} />}
              title={trip.title}
              name={trip.title}
              figures={`${trip.nights} ${trip.nights === 1 ? "night" : "nights"} · ${listingPrice(trip, rates)}`}
              heart={<HeartButton saved label={trip.title} onPress={() => toggle(trip.id, false)} />}
              onOpen={() => router.push({ pathname: "/explore/[preset]", params: { preset: trip.id } })}
              onStart={() => router.push({ pathname: "/explore/[preset]", params: { preset: trip.id, start: "1" } })}
            />
          ))}
          {countries.map((c, i) => (
            <CountryRow
              key={c.code}
              country={c}
              first={trips.length === 0 && i === 0}
              onDrop={() => mark.mutate({ code: c.code, state: "blank" })}
              onOpen={() => router.push({ pathname: "/explore", params: { country: c.code } })}
              onStart={() => router.push({ pathname: "/(app)/new-trip", params: { name: c.name } })}
            />
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

function CountryRow({ country, first, onDrop, onOpen, onStart }: { country: Country; first: boolean; onDrop: () => void; onOpen: () => void; onStart: () => void }) {
  const region = regionOf(country.code);
  const count = listingsIn(country.code).length;
  return (
    <SavedRow
      first={first}
      tags={region ? <RegionTags region={region} countries={country.name} /> : <PlainTag name={country.name} />}
      title="Want to go"
      figures={count === 0 ? "No trips on Explore yet" : `${count} ${count === 1 ? "trip" : "trips"} on Explore`}
      heart={<HeartButton saved label={country.name} onPress={onDrop} />}
      onOpen={onOpen}
      onStart={onStart}
      name={country.name}
    />
  );
}

function SavedRow({
  first,
  tags,
  title,
  figures,
  heart,
  onOpen,
  onStart,
  name,
}: {
  first: boolean;
  tags: React.ReactNode;
  title: string;
  figures: string;
  heart: React.ReactNode;
  onOpen: () => void;
  onStart: () => void;
  /** What the row is, for its Start trip's name. */
  name: string;
}) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        paddingHorizontal: space.lg,
        borderTopColor: c.rule,
        borderTopWidth: first ? 0 : StyleSheet.hairlineWidth,
      }}
    >
      <Pressable accessibilityRole="button" accessibilityLabel={`${title}, ${figures}`} onPress={onOpen} style={({ pressed }) => ({ flex: 1, gap: space.xs + 2, paddingVertical: space.lg, opacity: pressed ? 0.6 : 1 })}>
        {tags}
        <Text style={{ color: c.ink, fontFamily: fonts.sansBold, fontSize: size.body }}>{title}</Text>
        <Text style={{ color: c["ink-2"], fontFamily: fonts.type, fontSize: size.small, fontVariant: ["tabular-nums"] }}>{figures}</Text>
      </Pressable>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        {heart}
        <Button label="Start trip" accessibilityLabel={`Start trip from ${name}`} variant="quiet" fit="small" onPress={onStart} />
      </View>
    </View>
  );
}

function PlainTag({ name }: { name: string }) {
  const { c } = useTheme();
  return (
    <View style={{ alignSelf: "flex-start", borderColor: c["rule-2"], borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.pill, paddingVertical: 2, paddingHorizontal: space.sm }}>
      <Text numberOfLines={1} style={{ color: c["ink-2"], fontFamily: fonts.type, fontSize: size.label, textTransform: "uppercase", letterSpacing: 0.6 }}>
        {name}
      </Text>
    </View>
  );
}

function AddRow({ name, onPress }: { name: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Add ${name}`}
      onPress={onPress}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: space.sm, paddingVertical: space.sm, opacity: pressed ? 0.6 : 1 })}
    >
      <PlusGlyph color={c["ink-2"]} />
      <Body>{name}</Body>
    </Pressable>
  );
}
