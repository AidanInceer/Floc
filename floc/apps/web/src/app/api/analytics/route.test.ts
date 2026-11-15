import { beforeAll, beforeEach, expect, it } from "vitest";

import { encodeConsent } from "@floc/core/consent/consent";
import { today } from "@floc/core/dates/dates";

import { db } from "@/db";
import { analyticsEvent } from "@/db/schema";
import { migrateTestDb, resetDb } from "@/test/db";

import { POST } from "./route";

beforeAll(migrateTestDb);
beforeEach(resetDb);

it("counts a page view posted by a browser that said yes (#368)", async () => {
  const cookie = `floc_consent=${encodeConsent({ functional: false, analytics: true }, today())}`;
  const body = JSON.stringify({ name: "page.view", path: "/explore" });
  const answer = await POST(new Request("http://floc.test/api/analytics", { method: "POST", body, headers: { cookie } }));
  expect(answer.status).toBe(204);
  expect((await db.select().from(analyticsEvent).all()).map((row) => row.route)).toEqual(["/explore"]);
});
