/**
 * The database test harness (ticket 105).
 *
 * The suite before this one was 123 tests, all over pure functions, and every
 * finding in the critical section of the codebase review lived in *calling*
 * code — extracting the pure half bought testability by moving the risk out of
 * the tested surface. This is the way back in: a real migrated database, real
 * queries, and a seeded shape that makes "a member of one trip cannot touch
 * another trip's rows" a one-line assertion.
 *
 * See ./setup.ts for the seam this rests on and the Next.js stubs.
 */
import { migrate } from "drizzle-orm/libsql/migrator";
import { expect } from "vitest";

import { db, schema } from "@/db";
import { NOT_FOUND, currentUser } from "./setup";

let migrated = false;

/**
 * Migrates the worker's database, once. Cheap enough to call from every
 * suite's `beforeAll`, which is what keeps the harness from being skipped.
 */
export async function migrateTestDb(): Promise<void> {
  if (migrated) return;
  await migrate(db, { migrationsFolder: "./drizzle" });
  migrated = true;
}

/**
 * Every table, children before parents, so a delete never trips an FK.
 * Listed by hand rather than reflected: a new table that needs clearing should
 * be an obvious one-line edit here, not a silent gap.
 */
const TABLES = [
  schema.noteReaction,
  schema.note,
  schema.expenseSplit,
  schema.expense,
  schema.dayEvent,
  schema.day,
  schema.ideaVote,
  schema.idea,
  schema.availability,
  schema.nudge,
  schema.userCountryMark,
  schema.friendship,
  schema.tripInvite,
  schema.tripMembership,
  schema.trip,
  schema.place,
  schema.userProfile,
  schema.session,
  schema.account,
  schema.verification,
  schema.user,
] as const;

/** Empties every table. Call in `beforeEach` — suites share a worker's file. */
export async function resetDb(): Promise<void> {
  for (const table of TABLES) await db.delete(table);
  currentUser.id = null;
}

/** Who the next action call runs as. `null` for signed-out. */
export function signIn(userId: string | null): void {
  currentUser.id = userId;
}

async function makeUser(id: string, name: string) {
  await db
    .insert(schema.user)
    .values({ id, name, email: `${id}@example.test` });
  return id;
}

export type Scenario = Awaited<ReturnType<typeof seedScenario>>;

/**
 * The shape every access-control test needs: one trip with an admin and a
 * plain member, and a **second trip with a disjoint member**. The outsider is
 * the whole point — a test that only has a non-member proves nothing about
 * rule 5, because the interesting attacker is someone with a valid session and
 * a trip of their own who posts *our* child ids.
 *
 * Each trip gets one day, **two** events on that day, and one idea, so a
 * cross-trip write has something real to aim at. Two events rather than one is
 * load-bearing: a reorder of a single-event day is a no-op whatever the access
 * check does, so a one-event seed makes the drag tests pass vacuously.
 */
export async function seedScenario() {
  const admin = await makeUser("u-admin", "Ada");
  const member = await makeUser("u-member", "Mo");
  const outsider = await makeUser("u-outsider", "Ozz");

  async function makeTrip(name: string, token: string, owner: string) {
    const row = await db
      .insert(schema.trip)
      .values({ name, createdBy: owner, inviteToken: token })
      .returning({ id: schema.trip.id })
      .get();

    const dayRow = await db
      .insert(schema.day)
      .values({ tripId: row.id, date: "2026-09-01" })
      .returning({ id: schema.day.id })
      .get();

    // Distinct times, so a slot permutation has something to trade and a drag
    // that shouldn't have happened leaves visible evidence.
    const events = await db
      .insert(schema.dayEvent)
      .values([
        {
          dayId: dayRow.id,
          type: "activity" as const,
          title: `${name} event`,
          time: "09:00",
          orderIndex: 0,
        },
        {
          dayId: dayRow.id,
          type: "food" as const,
          title: `${name} dinner`,
          time: "19:00",
          orderIndex: 1,
        },
      ])
      .returning({ id: schema.dayEvent.id })
      .all();

    const ideaRow = await db
      .insert(schema.idea)
      .values({ tripId: row.id, createdBy: owner, note: `${name} idea` })
      .returning({ id: schema.idea.id })
      .get();

    return {
      id: row.id,
      dayId: dayRow.id,
      eventId: events[0].id,
      /** The 19:00 one — the other end of any reorder. */
      lateEventId: events[1].id,
      ideaId: ideaRow.id,
    };
  }

  const ours = await makeTrip("Ours", "token-ours", admin);
  const theirs = await makeTrip("Theirs", "token-theirs", outsider);

  await db.insert(schema.tripMembership).values([
    { tripId: ours.id, userId: admin, role: "admin" },
    { tripId: ours.id, userId: member, role: "member" },
    { tripId: theirs.id, userId: outsider, role: "admin" },
  ]);

  return { admin, member, outsider, ours, theirs };
}

/**
 * Asserts the call refused with `notFound()`.
 *
 * Rule 5 says a foreign id and a nonexistent one get the *same* response, so
 * "it threw something" is not good enough — a distinguishable error is itself
 * the leak. Tests assert this exact refusal.
 */
export async function expectNotFound(fn: () => Promise<unknown>): Promise<void> {
  await expect(fn()).rejects.toThrow(NOT_FOUND);
}
