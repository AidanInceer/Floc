/**
 * #653: "Send to me" on the email preview says whether it went, and production never answers it.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";

import { sendSampleToMe } from "./actions";

let world: Scenario;

const form = (key: string) => {
  const fd = new FormData();
  fd.append("key", key);
  return fd;
};

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  signIn(world.member);
});
afterEach(() => vi.unstubAllEnvs());

describe("send a sample to me", () => {
  it("says Sent when the sample went to the signed-in address", async () => {
    expect(await sendSampleToMe(null, form("reset"))).toBe("Sent");
  });

  it("says Not sent for a sample it does not know", async () => {
    expect(await sendSampleToMe(null, form("nope"))).toBe("Not sent");
  });

  it("is not there in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(sendSampleToMe(null, form("reset"))).rejects.toThrow();
  });
});
