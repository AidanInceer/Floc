import "server-only";

import { today } from "@floc/core/dates/dates";

import { listFriendsFor, type Person } from "@/server/social/friends";
import { invitableIdsOf, listGroupsFor, listPastTripsFor, type Group, type PastTrip } from "@/server/social/groups";

export async function peopleSourcesFor(viewerId: string): Promise<{ friends: Person[]; groups: Group[]; pastTrips: PastTrip[] }> {
  const [friends, groups, past, invitable] = await Promise.all([
    listFriendsFor(viewerId),
    listGroupsFor(viewerId),
    listPastTripsFor(viewerId, today()),
    invitableIdsOf(viewerId),
  ]);
  const pastTrips = past.map((t) => ({ ...t, people: t.people.filter((p) => invitable.has(p.id)) }));
  return { friends, groups, pastTrips };
}
