/**
 * The one place that knows which pages a change makes stale (ticket 241).
 *
 * Writes announce a *fact* — "the itinerary changed", "the money changed" —
 * and this module decides which routes to refresh. Nothing else in the app may
 * import `next/cache`; the dependency-cruiser rule `freshness-owns-the-cache`
 * enforces that, so a new page that reads existing data is taught about once,
 * here, rather than hunted for across every writer.
 *
 * Facts compose: moving the trip window moves the days with it (ticket 140),
 * so `tripWindow` implies `itinerary`, `tripDates` and `tripHeader` rather than
 * every caller remembering to say all four.
 */
import "server-only";

import { revalidatePath } from "next/cache";

import type { NoteScope } from "@/db/schema";

export type Fact =
  | { kind: "itinerary"; tripId: number }
  | { kind: "tripWindow"; tripId: number }
  | { kind: "tripDates"; tripId: number }
  | { kind: "tripHeader"; tripId: number }
  | { kind: "tripOverview"; tripId: number }
  | { kind: "ideas"; tripId: number }
  | { kind: "money"; tripId: number }
  | { kind: "packing"; tripId: number }
  | { kind: "documents"; tripId: number }
  | { kind: "tripLinks"; tripId: number }
  | { kind: "thread"; tripId: number; scope: NoteScope }
  | { kind: "tripList" }
  | { kind: "invites" }
  | { kind: "profile" }
  | { kind: "accountSettings" }
  | { kind: "profileTrips" }
  | { kind: "packingKits" }
  | { kind: "friendship"; otherId: string }
  | { kind: "inbox" }
  | { kind: "bell" }
  | { kind: "explore" };

export type FactKind = Fact["kind"];

/** A route to refresh. `layout` re-runs the segment's layout, not just the page. */
export type Target = { path: string; type?: "layout" };

type Pages = { [K in FactKind]: (fact: Extract<Fact, { kind: K }>) => Target[] };

/**
 * Fact → the pages that read it. Add a page that reads existing data and this
 * table is the only edit; `freshness.test.ts` is where the pairing is asserted.
 */
const PAGES: Pages = {
  // Days and Overview both draw off the same rows (ticket 142) — both or neither.
  itinerary: ({ tripId }) => [
    { path: `/trip/${tripId}/days` },
    { path: `/trip/${tripId}/overview` },
  ],
  tripWindow: () => [],
  tripDates: ({ tripId }) => [{ path: `/trip/${tripId}/dates` }],
  // The layout path alone doesn't refresh a page's own router cache, so pages
  // that need it say so with their own fact.
  tripHeader: ({ tripId }) => [{ path: `/trip/${tripId}`, type: "layout" }],
  tripOverview: ({ tripId }) => [{ path: `/trip/${tripId}/overview` }],
  ideas: ({ tripId }) => [{ path: `/trip/${tripId}/overview` }],
  money: ({ tripId }) => [{ path: `/trip/${tripId}/money` }],
  packing: ({ tripId }) => [{ path: `/trip/${tripId}/packing` }],
  // Days too since ticket 322: a file can sit on an event, and the block draws
  // a marker when it does.
  documents: ({ tripId }) => [
    { path: `/trip/${tripId}/files` },
    { path: `/trip/${tripId}/overview` },
    { path: `/trip/${tripId}/days` },
  ],
  tripLinks: ({ tripId }) => [{ path: `/trip/${tripId}/days` }],
  thread: ({ tripId, scope }) => [{ path: threadPath(tripId, scope) }],
  tripList: () => [{ path: "/trips" }, { path: "/trips/archived" }],
  invites: () => [{ path: "/trips" }],
  profile: () => [{ path: "/profile" }, { path: "/settings" }],
  // Sign-in methods and notification prefs live only on Settings.
  accountSettings: () => [{ path: "/settings" }],
  profileTrips: () => [{ path: "/profile" }],
  packingKits: () => [{ path: "/packing-lists" }],
  friendship: ({ otherId }) => [{ path: "/friends" }, { path: `/profile/${otherId}` }],
  inbox: () => [{ path: "/inbox" }],
  // The bell hangs off the root layout, so it is stale on every page at once.
  bell: () => [{ path: "/", type: "layout" }],
  explore: () => [{ path: "/explore" }],
};

/** Facts a fact drags with it. Same shape of id, so the implied fact reuses it. */
const IMPLIES: Partial<Record<FactKind, FactKind[]>> = {
  tripWindow: ["itinerary", "tripDates", "tripHeader"],
  inbox: ["bell"],
};

/** The tab a note thread is rendered on — notes hang off several surfaces. */
function threadPath(tripId: number, scope: NoteScope): string {
  switch (scope) {
    case "day_event":
    case "day":
      return `/trip/${tripId}/days`;
    case "expense":
      return `/trip/${tripId}/money`;
    case "trip":
      return `/trip/${tripId}/overview`;
  }
}

/** Every page a set of facts makes stale, implications expanded, no duplicates. */
export function pagesFor(facts: Fact[]): Target[] {
  const seen = new Map<string, Target>();
  const walk = (fact: Fact) => {
    // The lookup loses the tie between key and argument, so the union of
    // handlers has no callable signature. The table is exhaustive by `Pages`.
    const pages = PAGES[fact.kind] as (f: Fact) => Target[];
    for (const target of pages(fact)) {
      const key = `${target.type ?? "page"} ${target.path}`;
      if (!seen.has(key)) seen.set(key, target);
    }
    for (const kind of IMPLIES[fact.kind] ?? []) {
      walk({ ...fact, kind } as Fact);
    }
  };
  facts.forEach(walk);
  return [...seen.values()];
}

/** Announce what changed. Everything else is this module's problem. */
export function refresh(...facts: Fact[]): void {
  for (const target of pagesFor(facts)) {
    if (target.type) revalidatePath(target.path, target.type);
    else revalidatePath(target.path);
  }
}
