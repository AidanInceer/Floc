import { and, eq, isNull } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { ERASED_NAME, eraseAccount } from "@/server/auth/erase-account";
import { readPrivacy } from "@/server/auth/privacy";
import { readTravelStyle, saveTravelStyle } from "@/server/auth/travel-style";
import { readAlertSettings, setMarketingEmailConsent } from "@/server/notifications/alert-settings";
import { revokeGoogleGrant } from "@/server/calendar/calendar-import";

vi.mock("@/server/calendar/calendar-import", () => ({ revokeGoogleGrant: vi.fn() }));

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  await db.insert(schema.userProfile).values({
    userId: world.member,
    displayName: "Mo Rahman",
    friendTag: "morahman#K7M4",
  });
  await db.insert(schema.account).values({
    id: "acc-1",
    accountId: world.member,
    providerId: "credential",
    userId: world.member,
    password: "hash",
  });
  await db.insert(schema.session).values({
    id: "s-1",
    token: "t-1",
    userId: world.member,
    expiresAt: new Date(Date.now() + 60_000),
  });
  const bill = await db
    .insert(schema.expense)
    .values({
      tripId: world.ours.id,
      createdBy: world.member,
      paidBy: world.member,
      description: "Ferry",
      amountMinor: 4000,
      currency: "GBP",
      splitType: "even",
    })
    .returning({ id: schema.expense.id })
    .get();
  await db.insert(schema.expenseSplit).values([
    { expenseId: bill.id, userId: world.member, owedAmountMinor: 2000 },
    { expenseId: bill.id, userId: world.admin, owedAmountMinor: 2000 },
  ]);
});

const person = (id: string) =>
  db.select().from(schema.user).where(eq(schema.user.id, id)).get();

describe("erasing an account", () => {
  it("cuts off every app the person connected (#354)", async () => {
    const clientId = "https://agent.example/client.json";
    await db.insert(schema.oauthClient).values({ id: "c1", clientId, redirectUris: "[]" });
    await db.insert(schema.oauthConsent).values({ id: "o1", clientId, userId: world.member, scopes: "[]" });
    await db.insert(schema.oauthRefreshToken).values({ id: "r1", token: "rt", clientId, userId: world.member, scopes: "[]" });
    await db.insert(schema.oauthAccessToken).values({ id: "a1", token: "at", clientId, userId: world.member, scopes: "[]" });
    await eraseAccount(world.member);
    expect(await db.select().from(schema.oauthConsent).where(eq(schema.oauthConsent.userId, world.member))).toEqual([]);
    expect(await db.select().from(schema.oauthRefreshToken).where(eq(schema.oauthRefreshToken.userId, world.member))).toEqual([]);
    expect(await db.select().from(schema.oauthAccessToken).where(eq(schema.oauthAccessToken.userId, world.member))).toEqual([]);
  });

  it("keeps the row that the ledger points at, with nothing personal on it", async () => {
    await eraseAccount(world.member);

    const row = await person(world.member);
    expect(row?.name).toBe(ERASED_NAME);
    expect(row?.email).not.toContain("example.test");
    const profile = await db
      .select()
      .from(schema.userProfile)
      .where(eq(schema.userProfile.userId, world.member))
      .get();
    expect(profile?.displayName).toBeNull();
    expect(profile?.friendTag).toBeNull();
  });

  it("withdraws consent to advertising email", async () => {
    await setMarketingEmailConsent(world.member, true, new Date());
    await eraseAccount(world.member);

    expect((await readAlertSettings(world.member)).marketingEmailConsentAt).toBeNull();
  });

  it("clears the person's privacy, alerts and travel style, whether or not they ever saved any", async () => {
    await saveTravelStyle(world.member, { homeAirport: "DUB", travelCabin: "economy", travelStay: "mid", travelPace: "easy" });
    await eraseAccount(world.member);
    await eraseAccount(world.admin);

    for (const id of [world.member, world.admin]) {
      expect(await readPrivacy(id)).toMatchObject({ isPrivate: true });
      expect(await readAlertSettings(id)).toEqual({
        notifyPush: false,
        notifyEmail: false,
        notifyReminders: false,
        notifyNextTrip: false,
        marketingEmailConsentAt: null,
      });
      expect(await readTravelStyle(id)).toEqual({
        homeAirport: null,
        travelCabin: null,
        travelStay: null,
        travelPace: null,
        styleInGroupIdeas: false,
      });
    }
  });

  it("revokes Floc's Google grant first, so Floc leaves their Google account too (#444)", async () => {
    await eraseAccount(world.member);
    expect(revokeGoogleGrant).toHaveBeenCalledWith(world.member);
  });

  it("ends every way back in", async () => {
    await eraseAccount(world.member);

    expect(
      await db.select().from(schema.account).where(eq(schema.account.userId, world.member)).all(),
    ).toEqual([]);
    expect(
      await db.select().from(schema.session).where(eq(schema.session.userId, world.member)).all(),
    ).toEqual([]);
  });

  it("leaves every trip and keeps the money as it was", async () => {
    await eraseAccount(world.member);

    const live = await db
      .select()
      .from(schema.tripMembership)
      .where(
        and(
          eq(schema.tripMembership.userId, world.member),
          isNull(schema.tripMembership.deletedAt),
        ),
      )
      .all();
    expect(live).toEqual([]);
    const splits = await db.select().from(schema.expenseSplit).all();
    expect(splits.map((s) => s.owedAmountMinor)).toEqual([2000, 2000]);
  });

  it("frees the address for a new account", async () => {
    await eraseAccount(world.member);

    await db
      .insert(schema.user)
      .values({ id: "u-new", name: "Mo", email: "u-member@example.test" });
    expect((await person("u-new"))?.email).toBe("u-member@example.test");
  });
});
