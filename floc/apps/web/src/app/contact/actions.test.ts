import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { migrateTestDb, resetDb, seedScenario, signIn } from "@/test/db";

import { submitFeedback } from "./actions";

const form = (message: string): FormData => {
  const fd = new FormData();
  fd.append("message", message);
  fd.append("page", "/trips");
  return fd;
};

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  signIn((await seedScenario()).member);
});

describe("feedback from the Contact page", () => {
  it("is sent for a signed-in member", async () => {
    expect(await submitFeedback({}, form("The map is slow."))).toEqual({ sent: true });
  });

  it("says why an empty message was not sent", async () => {
    expect(await submitFeedback({}, form("  "))).toEqual({ error: "Write a few words first." });
  });

  it("is refused for a visitor who is not signed in", async () => {
    signIn(null);
    expect(await submitFeedback({}, form("Hello"))).toEqual({ error: "Sign in to send feedback." });
  });
});
