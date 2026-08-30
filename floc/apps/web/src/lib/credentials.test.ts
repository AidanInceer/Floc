import { describe, expect, it } from "vitest";

import { isValidEmail, passwordWeakness } from "./credentials";

describe("isValidEmail", () => {
  it("accepts a plain address", () => {
    expect(isValidEmail("ada@floc.example")).toBe(true);
  });

  it("rejects a missing @ or domain", () => {
    expect(isValidEmail("ada.floc.example")).toBe(false);
    expect(isValidEmail("ada@localhost")).toBe(false);
    expect(isValidEmail("ada @floc.example")).toBe(false);
  });
});

describe("passwordWeakness", () => {
  it("passes a letter+number password of 8+ chars", () => {
    expect(passwordWeakness("travel99")).toBeNull();
  });

  it("names the specific shortfall", () => {
    expect(passwordWeakness("short1")).toMatch(/8 characters/);
    expect(passwordWeakness("12345678")).toMatch(/letter/);
    expect(passwordWeakness("password")).toMatch(/number/);
  });
});
