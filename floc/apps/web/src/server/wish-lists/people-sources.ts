import "server-only";

import { today } from "@floc/core/dates/dates";

import { listFriendsFor, type Person } from "@/server/social/friends";
import { invitableIdsOf, listGroupsFor, listPastTripsFor, type Group, type PastTrip } from "@/server/social/groups";

/**
 * Who the wish list picker offers (#623): friends, your named groups and your past trips' people. A past trip can hold
 * someone you can no longer ask, so only the people you could ask onto a trip stay in it (ADR-049).
 */
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
