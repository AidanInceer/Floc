/**
 * Undo (#no-ticket). Takes out exactly what the seed put in, and nothing else,
 * so testing against a scenario can be a throwaway act you repeat daily.
 *
 * HOW IT KNOWS. Only by the email domain. Seeded people end `.seed.floc.test`;
 * a seeded trip is one a seeded person created *or belongs to*. Membership
 * counts because nothing but `db:seed` can make one of these accounts — a trip
 * with a seed person on the roster is a trip somebody set up to test with,
 * whoever pressed the button. It also keeps the delete possible at all: a trip
 * left standing still points at its payers, and `expense.paid_by` has no
 * cascade to clear itself out of the way.
 *
 * HARD DELETE, not the soft-delete every application read honours: a seed row
 * left tombstoned still holds its email, and the next seed would collide on it.
 */
import { inArray, like, or } from "drizzle-orm";

import { db } from "../index.ts";
import { trip, tripMembership, user } from "../schema.ts";
import { SEED_DOMAIN, type Scenario } from "./identity.ts";

/** Undefined wipes every scenario; a key wipes only that one. */
export async function resetSeed(scenario?: Scenario): Promise<{
  people: number;
  trips: number;
}> {
  const pattern = scenario ? `%@${scenario}.${SEED_DOMAIN}` : `%.${SEED_DOMAIN}`;

  const people = await db
    .select({ id: user.id })
    .from(user)
    .where(like(user.email, pattern))
    .all();

  if (people.length === 0) return { people: 0, trips: 0 };
  const ids = people.map((p) => p.id);

  const joined = await db
    .select({ tripId: tripMembership.tripId })
    .from(tripMembership)
    .where(inArray(tripMembership.userId, ids))
    .all();

  const trips = await db
    .select({ id: trip.id })
    .from(trip)
    .where(
      or(
        inArray(trip.createdBy, ids),
        inArray(
          trip.id,
          joined.map((t) => t.tripId),
        ),
      ),
    )
    .all();

  // Trips first: packing lines and expenses point at a user with no cascade of
  // their own, and only the trip's cascade clears them out of the way.
  if (trips.length > 0) {
    await db.delete(trip).where(
      inArray(
        trip.id,
        trips.map((t) => t.id),
      ),
    );
  }

  await db.delete(user).where(inArray(user.id, ids));

  return { people: people.length, trips: trips.length };
}
