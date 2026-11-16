import "server-only";

import { revalidatePath } from "next/cache";

import type { NoteScope } from "@/db/schema";
import { tripChanged } from "@/server/notes/live/live-trip";
import { forgetRequestReads } from "@/server/request-scope";

export type Fact =
  | { kind: "itinerary"; tripId: number }
  | { kind: "tripWindow"; tripId: number }
  | { kind: "tripDates"; tripId: number }
  | { kind: "tripHeader"; tripId: number }
  | { kind: "tripOverview"; tripId: number }
  | { kind: "ideas"; tripId: number }
  | { kind: "money"; tripId: number }
  | { kind: "estimate"; tripId: number }
  | { kind: "packing"; tripId: number }
  | { kind: "documents"; tripId: number }
  | { kind: "tripLinks"; tripId: number }
  | { kind: "thread"; tripId: number; scope: NoteScope }
  | { kind: "notesPages"; tripId: number }
  | { kind: "tripList" }
  | { kind: "invites" }
  | { kind: "invitePage"; token: string }
  | { kind: "profile" }
  | { kind: "accountSettings" }
  | { kind: "profileTrips" }
  | { kind: "packingKits" }
  | { kind: "friendship"; otherId: string }
  | { kind: "friendGroups" }
  | { kind: "inbox" }
  | { kind: "bell" }
  | { kind: "bookings" }
  | { kind: "explore" }
  | { kind: "savedTrips" }
  | { kind: "wishLists" };

export type FactKind = Fact["kind"];

export type Target = { path: string; type?: "layout" };

type Pages = { [K in FactKind]: (fact: Extract<Fact, { kind: K }>) => Target[] };

const PAGES: Pages = {
  itinerary: ({ tripId }) => [
    { path: `/trip/${tripId}/days` },
    { path: `/trip/${tripId}/overview` },
  ],
  tripWindow: () => [],
  tripDates: ({ tripId }) => [{ path: `/trip/${tripId}/dates` }],
  tripHeader: ({ tripId }) => [{ path: `/trip/${tripId}`, type: "layout" }],
  tripOverview: ({ tripId }) => [{ path: `/trip/${tripId}/overview` }],
  ideas: ({ tripId }) => [{ path: `/trip/${tripId}/overview` }],
  money: ({ tripId }) => [{ path: `/trip/${tripId}/money` }],
  estimate: ({ tripId }) => [{ path: `/trip/${tripId}/money` }, { path: `/trip/${tripId}/overview` }],
  packing: ({ tripId }) => [{ path: `/trip/${tripId}/packing` }],
  documents: ({ tripId }) => [
    { path: `/trip/${tripId}/files` },
    { path: `/trip/${tripId}/overview` },
    { path: `/trip/${tripId}/days` },
    { path: `/trip/${tripId}/dates` },
  ],
  tripLinks: ({ tripId }) => [{ path: `/trip/${tripId}/days` }],
  thread: ({ tripId, scope }) => [{ path: threadPath(tripId, scope) }],
  notesPages: ({ tripId }) => [{ path: `/trip/${tripId}/notes` }],
  tripList: () => [{ path: "/trips" }, { path: "/trips/archived" }],
  invites: () => [{ path: "/trips" }],
  invitePage: ({ token }) => [{ path: `/invite/${token}` }],
  profile: () => [{ path: "/profile" }, { path: "/lists" }],
  accountSettings: () => [{ path: "/profile" }],
  profileTrips: () => [{ path: "/profile" }],
  packingKits: () => [{ path: "/lists/packing" }],
  friendship: ({ otherId }) => [{ path: "/friends" }, { path: "/friends/groups" }, { path: `/profile/${otherId}` }],
  friendGroups: () => [{ path: "/friends" }, { path: "/friends/groups" }, { path: "/trips" }],
  inbox: () => [{ path: "/inbox" }],
  bell: () => [{ path: "/", type: "layout" }],
  bookings: () => [{ path: "/bookings" }],
  explore: () => [{ path: "/explore" }],
  savedTrips: () => [{ path: "/lists" }, { path: "/explore", type: "layout" }],
  wishLists: () => [{ path: "/lists/wish", type: "layout" }, { path: "/explore", type: "layout" }],
};

const IMPLIES: Partial<Record<FactKind, FactKind[]>> = {
  tripWindow: ["itinerary", "tripDates", "tripHeader"],
  inbox: ["bell"],
  bookings: ["bell"],
};

function threadPath(tripId: number, scope: NoteScope): string {
  switch (scope) {
    case "day_event":
    case "day":
      return `/trip/${tripId}/days`;
    case "expense":
      return `/trip/${tripId}/money`;
    case "trip":
      return `/trip/${tripId}/overview`;
    case "page":
      return `/trip/${tripId}/notes`;
  }
}

export function pagesFor(facts: Fact[]): Target[] {
  const seen = new Map<string, Target>();
  const walk = (fact: Fact) => {
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

export function tripAreasFor(facts: Fact[]): Map<number, string[]> {
  const areas = new Map<number, string[]>();
  for (const target of pagesFor(facts)) {
    const [, root, id, tab, ...rest] = target.path.split("/");
    const tripId = Number(id);
    if (root !== "trip" || !Number.isSafeInteger(tripId) || tripId <= 0 || rest.length) continue;
    const area = target.type === "layout" ? "trip" : (tab ?? "trip");
    const list = areas.get(tripId) ?? [];
    if (!list.includes(area)) list.push(area);
    areas.set(tripId, list);
  }
  return areas;
}

export function refresh(...facts: Fact[]): void {
  forgetRequestReads();
  for (const target of pagesFor(facts)) {
    if (target.type) revalidatePath(target.path, target.type);
    else revalidatePath(target.path);
  }
  for (const [tripId, areas] of tripAreasFor(facts)) tripChanged(tripId, areas);
}
