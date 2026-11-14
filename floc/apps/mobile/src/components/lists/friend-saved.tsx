/**
 * A friend's Saved part on their profile (#544, ADR-045): the Explore trips they saved, then the countries they want to go to.
 * Absent when they do not share it with you or saved nothing; countries come only through their Countries ring.
 * You both marks what you saved too.
 */
import { wantToGoCountries, type MapState } from "@floc/core/itinerary/travel-map";
import { friendSavedPart } from "@floc/core/people/shared-saves";
import { listingPrice } from "@floc/core/trip/explore/listing-price";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { View } from "react-native";

import { RegionTags } from "@/components/explore/region-tag";
import { HeartButton, useSavedTrips } from "@/components/explore/save-heart";
import { useListingRates } from "@/components/explore/use-listing-rates";
import { CountryRow } from "@/components/lists/saved-pane";
import { SavedRow, SavedSection, YouBoth } from "@/components/lists/saved-row";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";
import { countWord } from "@floc/core/text/count-word";

type Mark = { code: string; state: MapState };

const statesOf = (marks: Mark[]) => Object.fromEntries(marks.map((m) => [m.code, m.state]));

export function FriendSaved({ saved, map }: { saved: string[] | null; map: Mark[] | null }) {
  const router = useRouter();
  const mine = useQuery(trpc.me.profile.queryOptions());
  const { ids, toggle } = useSavedTrips();
  const rates = useListingRates();
  const part = friendSavedPart(saved, map ? { states: statesOf(map) } : null);
  if (!part) return null;

  const yours = new Set(mine.data ? wantToGoCountries({ states: statesOf(mine.data.map) }).map((c) => c.code) : []);
  const savedIds = new Set(ids);

  return (
    <View style={{ gap: space.lg }}>
      {part.trips.length ? (
        <SavedSection title="Saved trips" count={part.trips.length}>
          {part.trips.map((trip, i) => {
            const both = savedIds.has(trip.id);
            return (
              <SavedRow
                key={trip.id}
                first={i === 0}
                tags={<RegionTags region={trip.region} countries={trip.country} />}
                title={trip.title}
                figures={`${countWord(trip.nights, "night")} · ${listingPrice(trip, rates)}`}
                mark={both ? <YouBoth /> : null}
                heart={<HeartButton saved={both} label={trip.title} onPress={() => toggle(trip.id, !both)} />}
                onOpen={() => router.push({ pathname: "/explore/[preset]", params: { preset: trip.id } })}
                onStart={() => router.push({ pathname: "/explore/[preset]", params: { preset: trip.id, start: "1" } })}
              />
            );
          })}
        </SavedSection>
      ) : null}
      {part.countries.length ? (
        <SavedSection title="Saved countries" count={part.countries.length}>
          {part.countries.map((c, i) => (
            <CountryRow key={c.code} country={c} first={i === 0} mark={yours.has(c.code) ? <YouBoth /> : null} />
          ))}
        </SavedSection>
      ) : null}
    </View>
  );
}
