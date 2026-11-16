import { inArray, like, or } from "drizzle-orm";

import { db } from "../index.ts";
import { trip, tripMembership, user } from "../schema.ts";
import { SEED_DOMAIN, type Scenario } from "./identity.ts";

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
