/** The per-IP limit on new guests (#442, ADR-029): counted from the session rows Better Auth stamps. */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb } from "@/test/db";
import { GUEST_IP_LIMIT } from "@floc/core/people/guests";
import { guestsFromIpOverLimit } from "@/server/guests/guest-ip";

const NOW = new Date("2026-10-24T12:00:00Z");
const minutesAgo = (n: number) => new Date(NOW.getTime() - n * 60 * 1000);

beforeAll(migrateTestDb);
beforeEach(resetDb);

async function guestFrom(id: string, ip: string, at: Date, isAnonymous = true) {
  await db.insert(schema.user).values({ id, name: id, email: `${id}@x.test`, isAnonymous });
  await db.insert(schema.session).values({ id: `s-${id}`, token: `t-${id}`, userId: id, ipAddress: ip, expiresAt: NOW, createdAt: at, updatedAt: at });
}

describe("guestsFromIpOverLimit", () => {
  it("is under the limit up to and including the limit", async () => {
    for (let i = 0; i < GUEST_IP_LIMIT; i++) await guestFrom(`g-${i}`, "1.2.3.4", minutesAgo(10));
    expect(await guestsFromIpOverLimit("1.2.3.4", NOW)).toBe(false);
  });

  it("is over once one more guest comes from that address in the hour", async () => {
    for (let i = 0; i <= GUEST_IP_LIMIT; i++) await guestFrom(`g-${i}`, "1.2.3.4", minutesAgo(10));
    expect(await guestsFromIpOverLimit("1.2.3.4", NOW)).toBe(true);
  });

  it("ignores guests from over an hour ago, other addresses and real accounts", async () => {
    for (let i = 0; i <= GUEST_IP_LIMIT; i++) await guestFrom(`old-${i}`, "1.2.3.4", minutesAgo(61));
    for (let i = 0; i <= GUEST_IP_LIMIT; i++) await guestFrom(`far-${i}`, "5.6.7.8", minutesAgo(5));
    for (let i = 0; i <= GUEST_IP_LIMIT; i++) await guestFrom(`real-${i}`, "1.2.3.4", minutesAgo(5), false);
    expect(await guestsFromIpOverLimit("1.2.3.4", NOW)).toBe(false);
  });
});
