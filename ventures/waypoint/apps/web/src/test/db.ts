/**
 * The database test harness (ticket 105): a real migrated database, real
 * queries, and a seeded shape that makes "a member of one trip cannot touch
 * another trip's rows" a one-line assertion. See ./setup.ts for the seam and
 * the Next.js stubs.
 */
import { migrate } from "drizzle-orm/libsql/migrator";
import { expect } from "vitest";

import { db, schema } from "@/db";
import { NOT_FOUND, currentUser } from "./setup";

let migrated = false;

// Once per worker; cheap enough to call from every suite's beforeAll.
export async function migrateTestDb(): Promise<void> {
  if (migrated) return;
  await migrate(db, { migrationsFolder: "./drizzle" });
  migrated = true;
}

// Children before parents, so a delete never trips an FK. Listed by hand so a
// new table needing clearing is an obvious edit, not a silent gap.
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

// Call in beforeEach — suites share a worker's file.
export async function resetDb(): Promise<void> {
  for (const table of TABLES) await db.delete(table);
  currentUser.id = null;
}

// null for signed-out.
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
 * One trip with an admin and a member, plus a second trip with a disjoint
 * member — the outsider is the point: rule 5 needs an attacker with a valid
 * session of their own, not just a non-member. Two events per day, not one:
 * a single-event day's reorder is a no-op regardless of the access check, so
 * it would make drag tests pass vacuously.
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

    // Distinct times so a drag that shouldn't have happened leaves evidence.
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
      lateEventId: events[1].id, // the 19:00 one
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

// Rule 5: foreign and nonexistent ids get the same response, so "it threw
// something" isn't good enough — assert this exact refusal.
export async function expectNotFound(fn: () => Promise<unknown>): Promise<void> {
  await expect(fn()).rejects.toThrow(NOT_FOUND);
}
