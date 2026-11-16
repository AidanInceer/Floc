"use client";

import type { FriendSavedPart } from "@floc/core/people/shared-saves";

import { ExploreTile } from "@/components/explore/all/explore-tile";
import { useSavedTrips } from "@/components/explore/save/saved-trips";

import { CountryTile } from "./country-tile";
import { YouBoth } from "./friend-faces";
import { SavedSection, savedCountryGridClass, savedTripGridClass } from "./saved-section";
import { StartTripButton } from "./start-trip-button";

export function FriendSaved({ part, yourCountries }: { part: FriendSavedPart; yourCountries: string[] }) {
  const { ids } = useSavedTrips();
  const yours = new Set(yourCountries);
  return (
    <div>
      {part.trips.length ? (
        <SavedSection title="Saved trips" count={part.trips.length}>
          <ul className={savedTripGridClass}>
            {part.trips.map((trip) => (
              <li key={trip.id}>
                <ExploreTile trip={trip} action={<StartTripButton saved={{ kind: "trip", id: trip.id }} name={trip.title} />}>
                  {ids.has(trip.id) ? <YouBoth /> : null}
                </ExploreTile>
              </li>
            ))}
          </ul>
        </SavedSection>
      ) : null}
      {part.countries.length ? (
        <SavedSection title="Saved countries" count={part.countries.length}>
          <ul className={savedCountryGridClass}>
            {part.countries.map((c) => (
              <li key={c.code}>
                <CountryTile code={c.code} name={c.name}>
                  {yours.has(c.code) ? <YouBoth /> : null}
                </CountryTile>
              </li>
            ))}
          </ul>
        </SavedSection>
      ) : null}
    </div>
  );
}
