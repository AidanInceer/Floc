import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/server/auth/auth";
import { migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";

import { answerConnect } from "./actions";

const oauth2Consent = vi.fn();
(auth.api as unknown as { oauth2Consent: typeof oauth2Consent }).oauth2Consent = oauth2Consent;

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  oauth2Consent.mockReset();
});

describe("answering an app that asks to connect (#354)", () => {
  it("passes the person's yes and sends them back to the app", async () => {
    signIn(world.member);
    oauth2Consent.mockResolvedValue({ redirect: true, url: "https://agent.example/back?code=1" });
    expect(await answerConnect("sig=abc", true)).toEqual({ url: "https://agent.example/back?code=1" });
    expect(oauth2Consent.mock.calls[0][0].body).toEqual({ accept: true, oauth_query: "sig=abc" });
  });

  it("passes a no as well", async () => {
    signIn(world.member);
    oauth2Consent.mockResolvedValue({ redirect: true, url: "https://agent.example/back?error=access_denied" });
    await answerConnect("sig=abc", false);
    expect(oauth2Consent.mock.calls[0][0].body.accept).toBe(false);
  });

  it("says so when the request is forged or out of date", async () => {
    signIn(world.member);
    oauth2Consent.mockRejectedValue(new Error("invalid_signature"));
    expect(await answerConnect("sig=forged", true)).toEqual({ error: "This request has ended. Start again from the app." });
  });

  it("never answers for someone who is not signed in", async () => {
    signIn(null);
    await expect(answerConnect("sig=abc", true)).rejects.toThrow();
    expect(oauth2Consent).not.toHaveBeenCalled();
  });
});
