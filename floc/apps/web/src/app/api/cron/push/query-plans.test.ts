import { createClient, type Client, type InArgs, type InStatement, type TransactionMode } from "@libsql/client";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db, schema } from "@/db";
import { insertIdea, toggleIdeaVote } from "@/server/ideas/ideas";
import { setAvailability } from "@/server/itinerary/availability";
import { writeExpense } from "@/server/money/money";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

vi.mock("@/server/notifications/expo-push", () => ({ sendExpoPushes: async () => ({ deadTokens: [] }) }));

import { POST } from "./route";

const NOW = new Date("2026-09-13T09:00:00Z");
const HOUR_MS = 3_600_000;
const HISTORY_TABLES = new Set([
  "activity",
  "availability",
  "idea_vote",
  "notification",
  "notification_delivery",
  "trip",
  "trip_membership",
  "user",
]);

type Recorded = { sql: string; args: InArgs };

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  vi.stubEnv("CRON_SECRET", "cron-secret");
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const recorded = (statement: InStatement): Recorded =>
  typeof statement === "string" ? { sql: statement, args: [] } : { sql: statement.sql, args: statement.args ?? [] };

function recordStatements(): Recorded[] {
  const client = db.$client;
  const seen: Recorded[] = [];
  const execute = client.execute.bind(client) as (statement: InStatement) => ReturnType<typeof client.execute>;
  const batch = client.batch.bind(client);
  const transaction = client.transaction.bind(client);
  vi.spyOn(client, "execute").mockImplementation(((statement: InStatement) => {
    seen.push(recorded(statement));
    return execute(statement);
  }) as typeof client.execute);
  vi.spyOn(client, "batch").mockImplementation((statements, mode) => {
    seen.push(...statements.map((s) => recorded(Array.isArray(s) ? { sql: s[0], args: s[1] } : s)));
    return batch(statements, mode);
  });
  vi.spyOn(client, "transaction").mockImplementation((async (mode?: TransactionMode) => {
    const tx = await transaction(mode);
    const txExecute = tx.execute.bind(tx);
    tx.execute = (statement) => {
      seen.push(recorded(statement));
      return txExecute(statement);
    };
    return tx;
  }) as typeof client.transaction);
  return seen;
}

const aliasesIn = (sql: string) => new Map([...sql.matchAll(/"(\w+)" "(\w+)"/g)].map((m) => [m[2], m[1]]));

async function withPlanReader<T>(work: (reader: Client) => Promise<T>): Promise<T> {
  const reader = createClient({ url: process.env.TURSO_DATABASE_URL! });
  try {
    return await work(reader);
  } finally {
    reader.close();
  }
}

const wholeTableReads = (statements: Recorded[]) =>
  withPlanReader(async (reader) => {
    const found = new Set<string>();
    for (const { sql, args } of statements) {
      if (!/^\s*(select|update|delete|insert)/i.test(sql)) continue;
      const aliases = aliasesIn(sql);
      const { rows } = await reader.execute({ sql: `explain query plan ${sql}`, args });
      for (const row of rows) {
        const name = /^SCAN (\S+)/.exec(String(row.detail))?.[1];
        if (!name) continue;
        const table = aliases.get(name) ?? name;
        if (HISTORY_TABLES.has(table)) found.add(`${table}: ${String(row.detail)} in ${sql.slice(0, 140)}`);
      }
    }
    return [...found];
  });

async function makeTrip(name: string, token: string, owner: string, startDate: string, endDate: string, others: string[] = []) {
  const row = await db
    .insert(schema.trip)
    .values({ name, createdBy: owner, inviteToken: token, startDate, endDate })
    .returning({ id: schema.trip.id })
    .get();
  await db.insert(schema.tripMembership).values([owner, ...others].map((userId) => ({ tripId: row.id, userId })));
  return row.id;
}

async function waitingNotice(userId: string, actorId: string, tripId: number) {
  const at = new Date(NOW.getTime() - HOUR_MS);
  const row = await db
    .insert(schema.activity)
    .values({ tripId, actorId, kind: "nudge_sent", subjectId: tripId, href: `/trip/${tripId}/overview`, createdAt: at, lastModifiedAt: at })
    .returning({ id: schema.activity.id })
    .get();
  const line = await db
    .insert(schema.notification)
    .values({ activityId: row.id, userId, loud: true, createdAt: at, lastModifiedAt: at })
    .returning({ id: schema.notification.id })
    .get();
  await db.insert(schema.notificationDelivery).values(
    schema.DELIVERY_CHANNELS.map((channel) => ({ notificationId: line.id, channel, createdAt: at, lastModifiedAt: at })),
  );
}

async function seedEveryCronPath() {
  const { admin, member, ours, theirs } = world;
  await db.update(schema.trip).set({ startDate: "2026-09-20", endDate: "2026-09-27" }).where(eq(schema.trip.id, ours.id));
  await db.update(schema.trip).set({ startDate: "2026-07-10", endDate: "2026-07-15" }).where(eq(schema.trip.id, theirs.id));
  const ended = await makeTrip("Ended", "token-ended", admin, "2026-09-01", "2026-09-06", [member]);
  await writeExpense({
    tripId: ended,
    createdBy: admin,
    fields: { dayId: null, paidBy: admin, description: "Dinner", amountMinor: 3000, currency: "GBP", splitType: "even", category: "other", notes: null },
    splits: [
      { userId: admin, owedAmountMinor: 1500 },
      { userId: member, owedAmountMinor: 1500 },
    ],
  });
  await db.update(schema.user).set({ emailVerified: true }).where(eq(schema.user.id, admin));
  await db.insert(schema.pushToken).values({ userId: member, token: "ExponentPushToken[plan]", registeredAt: new Date(NOW.getTime() - 2 * HOUR_MS) });
  await waitingNotice(member, admin, ours.id);
  await waitingNotice(admin, member, ours.id);

  const guestAt = new Date(NOW.getTime() - 8 * 24 * HOUR_MS);
  await db.insert(schema.user).values({ id: "g-old", name: "Guest", email: "g-old@guest.test", isAnonymous: true, createdAt: guestAt, updatedAt: guestAt });
  const ideaId = await insertIdea({ tripId: ours.id, createdBy: admin, title: "Lisbon" });
  await toggleIdeaVote(ideaId, "g-old");
  await setAvailability(ours.id, "g-old", ["2026-09-01"], true);
}

const runCron = () =>
  POST(new Request("http://localhost/api/cron/push", { method: "POST", headers: { authorization: "Bearer cron-secret" } }));

describe("cron query plans (ADR-084)", () => {
  it("reads no history table from end to end", async () => {
    await seedEveryCronPath();
    const statements = recordStatements();

    const response = await runCron();
    const result = await response.json();
    vi.restoreAllMocks();

    expect(response.status).toBe(200);
    expect(result).toMatchObject({ guests: 1, pushes: 1, emails: 1 });
    expect(result.reminders).toBeGreaterThan(0);
    expect(await wholeTableReads(statements)).toEqual([]);
  });
});

describe("index tidy-up (ADR-084)", () => {
  const indexNames = () =>
    withPlanReader(async (reader) => {
      const { rows } = await reader.execute("select name from sqlite_master where type = 'index'");
      return new Set(rows.map((r) => String(r.name)));
    });

  it("holds no index that repeats the start of another", async () => {
    const names = await indexNames();
    for (const gone of [
      "notification_user_idx",
      "user_country_mark_user_idx",
      "packing_line_trip_idx",
      "document_trip_idx",
      "idea_vote_idea_idx",
      "comment_reaction_comment_idx",
      "wish_list_item_vote_item_idx",
    ]) {
      expect(names.has(gone), gone).toBe(false);
    }
  });

  it.each([
    ["notification", "user_id"],
    ["user_country_mark", "user_id"],
    ["packing_line", "trip_id"],
    ["document", "trip_id"],
    ["idea_vote", "idea_id"],
    ["comment_reaction", "comment_id"],
    ["wish_list_item_vote", "item_id"],
  ])("still finds %s rows by %s through an index", async (table, column) => {
    const { rows } = await withPlanReader((reader) =>
      reader.execute({ sql: `explain query plan select * from ${table} where ${column} = ?`, args: [1] }),
    );
    expect(String(rows[0].detail)).toMatch(/^SEARCH .* USING (COVERING )?INDEX/);
  });
});
