import { beforeEach, describe, expect, it, vi } from "vitest";

import { CONSENT_COOKIE, encodeConsent } from "@floc/core/consent/consent";
import { today } from "@floc/core/dates/dates";

const jar = new Map<string, { value: string }>();
vi.mock("next/headers", () => ({ cookies: async () => jar, headers: async () => new Headers() }));

import { requestConsent } from "./consent";

beforeEach(() => jar.clear());

describe("the consent choice on a request (#368)", () => {
  it("is unanswered for a visitor with no choice stored", async () => {
    expect(await requestConsent()).toBeNull();
  });

  it("is what the visitor chose", async () => {
    jar.set(CONSENT_COOKIE, { value: encodeConsent({ functional: false, analytics: true }, today()) });
    expect(await requestConsent()).toEqual({ functional: false, analytics: true });
  });

  it("is unanswered again once the choice is a year old", async () => {
    jar.set(CONSENT_COOKIE, { value: "1.f1.a1.2020-01-01" });
    expect(await requestConsent()).toBeNull();
  });
});
