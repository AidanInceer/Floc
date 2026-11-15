import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/db";
import { analyticsEvent } from "@/db/schema";
import { webPort } from "@/server/api-port/api-port";
import { migrateTestDb, resetDb } from "@/test/db";

beforeAll(migrateTestDb);
beforeEach(resetDb);

describe("a screen view from the phone (#368)", () => {
  it("is counted with the phone's surface and no id from the path", async () => {
    await webPort.recordAnalytics({ name: "page.view", path: "/trip/12/money", surface: "android" });
    const rows = await db.select().from(analyticsEvent).all();
    expect(rows.map((row) => `${row.surface} ${row.route}`)).toEqual(["android /trip/[id]/money"]);
  });
});
