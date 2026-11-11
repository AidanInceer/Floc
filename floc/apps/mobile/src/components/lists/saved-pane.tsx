/**
 * Saved (#467, ADR-042): the Explore trips you saved, then the countries you want to go to, as rows.
 * Trips and countries sit in their own sections (A3); a country's name is its title. A row opens the trip or Explore searched for
 * the country; Start trip, in pen on its last line, starts one from it.
 * A country is the globe's yellow, so adding or removing one here paints the globe too.
 * While your list is shared, one quiet line says who sees it; friends who saved a row too show as initials on it (#544).
 */
import { wantToGoCountries } from "@floc/core/itinerary/travel-map";
import { COUNTRIES } from "@floc/core/people/countries";
import { savedSeenBy, type FriendSaves } from "@floc/core/people/shared-saves";
import { listingsIn } from "@floc/core/trip/explore/listing-countries";
import { listingPrice } from "@floc/core/trip/explore/listing-price";
import { PRESET_TRIPS, type PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { RegionTags } from "@/components/explore/region-tag";
import { useListingRates } from "@/components/explore/use-listing-rates";
import { HeartButton, useSavedTrips } from "@/components/explore/save-heart";
import { FriendFaces, SavedRow, SavedSection } from "@/components/lists/saved-row";
import { PlusGlyph } from "@/components/system/glyphs";
import { useTheme } from "@/components/system/theme";
import { Body, Button, Card, Failed, Loading, SearchField } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { fonts, size, space } from "@/lib/theme";

type Country = { code: string; name: string };

const byId = new Map(PRESET_TRIPS.map((t) => [t.id, t]));
const NO_FRIENDS: FriendSaves = { trips: {}, countries: {} };

export function SavedPane() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const face = useQuery(trpc.me.profile.queryOptions());
  const settings = useQuery(trpc.settings.get.queryOptions());
  const friendSaves = useQuery(trpc.explore.friendSaves.queryOptions());
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
  // Why: the faces are extra; a failed read leaves the rows as they were rather than failing the tab (#544).
  const friends = friendSaves.data ?? NO_FRIENDS;
  const seenBy = settings.data ? savedSeenBy(settings.data.visibilitySaved, settings.data.isPrivate) : null;

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }} keyboardShouldPersistTaps="handled">
      {seenBy ? <SeenByLine text={seenBy} onPress={() => router.push("/settings")} /> : null}
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
        <>
          {trips.length ? (
            <SavedSection title="Trips" count={trips.length}>
              {trips.map((trip, i) => (
                <SavedRow
                  key={trip.id}
                  first={i === 0}
                  tags={<RegionTags region={trip.region} countries={trip.country} />}
                  title={trip.title}
                  figures={`${trip.nights} ${trip.nights === 1 ? "night" : "nights"} · ${listingPrice(trip, rates)}`}
                  mark={<FriendFaces faces={friends.trips[trip.id]} />}
                  heart={<HeartButton saved label={trip.title} onPress={() => toggle(trip.id, false)} />}
                  onOpen={() => router.push({ pathname: "/explore/[preset]", params: { preset: trip.id } })}
                  onStart={() => router.push({ pathname: "/explore/[preset]", params: { preset: trip.id, start: "1" } })}
                />
              ))}
            </SavedSection>
          ) : null}
          {countries.length ? (
            <SavedSection title="Countries" count={countries.length}>
              {countries.map((c, i) => (
                <CountryRow
                  key={c.code}
                  country={c}
                  first={i === 0}
                  mark={<FriendFaces faces={friends.countries[c.code]} />}
                  heart={<HeartButton saved label={c.name} onPress={() => mark.mutate({ code: c.code, state: "blank" })} />}
                />
              ))}
            </SavedSection>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

/** A saved country as a row: Explore searched for it, or a new trip named for it. Also on a friend's profile (#544). */
export function CountryRow({ country, first, mark, heart }: { country: Country; first: boolean; mark?: React.ReactNode; heart?: React.ReactNode }) {
  const router = useRouter();
  const count = listingsIn(country.code).length;
  return (
    <SavedRow
      first={first}
      title={country.name}
      figures={count === 0 ? "No Explore trips" : `${count} Explore ${count === 1 ? "trip" : "trips"}`}
      mark={mark}
      heart={heart}
      onOpen={() => router.push({ pathname: "/explore", params: { country: country.code } })}
      onStart={() => router.push({ pathname: "/(app)/new-trip", params: { name: country.name } })}
    />
  );
}

function SeenByLine({ text, onPress }: { text: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityHint="Opens Settings"
      onPress={onPress}
      style={({ pressed }) => ({ minHeight: 44, justifyContent: "center", alignSelf: "flex-start", opacity: pressed ? 0.6 : 1 })}
    >
      <Text style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small }}>{text}</Text>
    </Pressable>
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
