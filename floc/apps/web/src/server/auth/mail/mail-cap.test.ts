import { describe, expect, it } from "vitest";

import { mailCap } from "./mail-cap";

const HOUR = 60 * 60 * 1000;

describe("the cap on account mail to one address (#582)", () => {
  it("sends a few a day to an address, then stops", () => {
    const cap = mailCap({ perDay: 2 });
    expect(cap.allow("verify", "ana@example.test", 0)).toBe(true);
    expect(cap.allow("verify", "ana@example.test", HOUR)).toBe(true);
    expect(cap.allow("verify", "ana@example.test", 2 * HOUR)).toBe(false);
  });

  it("sends again a day after the first", () => {
    const cap = mailCap({ perDay: 1 });
    cap.allow("reset", "ana@example.test", 0);
    expect(cap.allow("reset", "ana@example.test", 23 * HOUR)).toBe(false);
    expect(cap.allow("reset", "ana@example.test", 25 * HOUR)).toBe(true);
  });

  it("reads one address the same however it is typed, and counts each kind and address apart", () => {
    const cap = mailCap({ perDay: 1 });
    cap.allow("verify", "Ana@Example.test ", 0);
    expect(cap.allow("verify", "ana@example.test", 0)).toBe(false);
    expect(cap.allow("reset", "ana@example.test", 0)).toBe(true);
    expect(cap.allow("verify", "mo@example.test", 0)).toBe(true);
  });

  it("stays a bounded size under a spray of addresses", () => {
    const cap = mailCap({ perDay: 1, maxKeys: 3 });
    for (let i = 0; i < 10; i += 1) cap.allow("verify", `${i}@example.test`, i);
    expect(cap.size()).toBeLessThanOrEqual(3);
  });
});
