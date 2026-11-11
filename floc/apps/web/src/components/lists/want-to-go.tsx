"use client";

import { COUNTRIES } from "@floc/core/people/countries";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { useOptimistic, useState, useTransition } from "react";

import { setCountryMark } from "@/app/profile/actions";
import { ExploreTile } from "@/components/explore/all/explore-tile";
import { PlusIcon } from "@/components/system/icons";
import { ButtonLink, Input } from "@/components/system/ui";
import type { FriendSaves } from "@floc/core/people/shared-saves";

import { CountryTile } from "./country-tile";
import { FriendFaces } from "./friend-faces";
import { SavedSection, savedCountryGridClass, savedTripGridClass } from "./saved-section";
import { StartTripButton } from "./start-trip-button";

type Country = { code: string; name: string };

const byName = (a: Country, b: Country) => a.name.localeCompare(b.name);

/**
 * Where you want to go (#467, ADR-042): the Explore trips you saved, then the countries, both as tiles.
 * Trips and countries sit apart (A3): trips as Explore tiles, countries four across and smaller. A tile opens the trip or Explore
 * searched for the country; Start trip on its last line starts one from it. A country is the globe's yellow, so adding or removing one paints it.
 */
export function WantToGo({ trips, countries, friends }: { trips: PresetTrip[]; countries: Country[]; friends: FriendSaves }) {
  const [shown, change] = useOptimistic(countries, (list, next: { add?: Country; drop?: string }) =>
    next.add ? [...list, next.add].sort(byName) : list.filter((c) => c.code !== next.drop),
  );
  const [, start] = useTransition();
  const [filter, setFilter] = useState("");
  const needle = filter.trim().toLowerCase();
  const have = new Set(shown.map((c) => c.code));
  const found = needle ? COUNTRIES.filter((c) => !have.has(c.code) && c.name.toLowerCase().includes(needle)).slice(0, 8) : [];

  const add = (country: Country) =>
    start(async () => {
      setFilter("");
      change({ add: country });
      await setCountryMark(country.code, "yellow");
    });
  const drop = (code: string) =>
    start(async () => {
      change({ drop: code });
      await setCountryMark(code, "blank");
    });

  return (
    <section aria-label="Saved">
      <div className="mb-6">
        <label className="block">
          <span className="typed mb-1.5 block">Add a country</span>
          <Input value={filter} onChange={(e) => setFilter(e.target.value)} autoComplete="off" />
        </label>
        {needle ? (
          <ul className="mt-2 max-h-64 overflow-y-auto rounded-md bg-sheet-2">
            {found.length === 0 ? (
              <li className="px-2.5 py-2 text-sm text-ink-soft">No country by that name.</li>
            ) : (
              found.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => add(c)}
                    className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-sm hover:bg-pen-soft hover:text-pen-deep"
                  >
                    <PlusIcon />
                    <span className="flex-1">{c.name}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
      {trips.length + shown.length === 0 ? (
        <div className="flex justify-center py-6">
          <ButtonLink href="/explore">Find a trip on Explore</ButtonLink>
        </div>
      ) : (
        <div>
          {trips.length ? (
            <SavedSection title="Trips" count={trips.length}>
              <ul className={savedTripGridClass}>
                {trips.map((trip) => (
                  <li key={trip.id}>
                    <ExploreTile trip={trip} action={<StartTripButton saved={{ kind: "trip", id: trip.id }} name={trip.title} />}>
                      <FriendFaces faces={friends.trips[trip.id]} />
                    </ExploreTile>
                  </li>
                ))}
              </ul>
            </SavedSection>
          ) : null}
          {shown.length ? (
            <SavedSection title="Countries" count={shown.length}>
              <ul className={savedCountryGridClass}>
                {shown.map((c) => (
                  <li key={c.code}>
                    <CountryTile code={c.code} name={c.name} onDrop={() => drop(c.code)}>
                      <FriendFaces faces={friends.countries[c.code]} />
                    </CountryTile>
                  </li>
                ))}
              </ul>
            </SavedSection>
          ) : null}
        </div>
      )}
    </section>
  );
}
