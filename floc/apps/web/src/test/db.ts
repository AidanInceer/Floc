import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/libsql/migrator";
import { expect } from "vitest";

import { db, schema } from "@/db";
import { NOT_FOUND, currentUser } from "./setup";

let migrated = false;

export async function migrateTestDb(): Promise<void> {
  if (migrated) return;
  await db.run(sql`PRAGMA synchronous = OFF`);
  await migrate(db, { migrationsFolder: "./drizzle" });
  migrated = true;
}

const TABLES = [
  schema.analyticsEvent,
  schema.termsAcceptance,
  schema.bookingInbox,
  schema.inboundMail,
  schema.reminder,
  schema.pushToken,
  schema.notification,
  schema.activity,
  schema.packingClaim,
  schema.packingLine,
  schema.noteReaction,
  schema.note,
  schema.ideaVote,
  schema.idea,
  schema.expenseSplit,
  schema.expense,
  schema.settlement,
  schema.fxRate,
  schema.dayEvent,
  schema.day,
  schema.availability,
  schema.tripLengthChoice,
  schema.nudge,
  schema.userCountryMark,
  schema.exploreSave,
  schema.wishListItem,
  schema.wishListMember,
  schema.wishList,
  schema.friendGroupMember,
  schema.friendGroup,
  schema.friendship,
  schema.tripInvite,
  schema.tripMembership,
  schema.billingCustomer,
  schema.subscription,
  schema.tripPage,
  schema.trip,
  schema.place,
  schema.userProfile,
  schema.session,
  schema.account,
  schema.verification,
  schema.user,
] as const;

export async function resetDb(): Promise<void> {
  const [first, ...rest] = TABLES.map((table) => db.delete(table));
  await db.batch([first, ...rest]);
  currentUser.id = null;
  currentUser.startedAt = undefined;
}

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

    return {
      id: row.id,
      dayId: dayRow.id,
      eventId: events[0].id,
      lateEventId: events[1].id,
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

export async function givePro(userId: string): Promise<void> {
  await db.insert(schema.subscription).values({
    userId,
    status: "active",
    source: "comp",
    currentPeriodEnd: null,
    stripeSubscriptionId: `sub_test_${userId}`,
  });
}

export async function befriend(a: string, b: string): Promise<void> {
  await db.insert(schema.friendship).values({ userId: a, friendId: b, status: "accepted" });
}

export async function expectNotFound(fn: () => Promise<unknown>): Promise<void> {
  await expect(fn()).rejects.toThrow(NOT_FOUND);
}
