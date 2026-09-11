import { describe, expect, it, vi } from "vitest";

vi.mock("./config", () => ({ API_BASE_URL: "http://dev.test:3000" }));

const { OFFLINE, explainGoogle, explainSignIn, explainSignUp, unreachable } = await import("./auth-errors");

describe("unreachable", () => {
  it("is a request with no status", () => {
    expect(unreachable({})).toBe(true);
    expect(unreachable({ status: 0 })).toBe(true);
    expect(unreachable({ status: 401 })).toBe(false);
  });
});

describe("explainSignIn", () => {
  it("names the server when it cannot be reached", () => {
    expect(explainSignIn({})).toBe(OFFLINE);
    expect(OFFLINE).toContain("http://dev.test:3000");
  });

  it("never says which of email or password was wrong", () => {
    expect(explainSignIn({ status: 401 })).toBe("That email and password don't match.");
  });
});

describe("explainSignUp", () => {
  it("is offline with no status", () => {
    expect(explainSignUp({})).toBe(OFFLINE);
  });

  it("points an existing address at sign in", () => {
    expect(explainSignUp({ status: 422, message: "User already exists" })).toMatch(/sign in instead/);
    expect(explainSignUp({ status: 422, message: "Email already registered" })).toMatch(/sign in instead/);
  });

  it("passes other messages through, with a fallback", () => {
    expect(explainSignUp({ status: 400, message: "Password too short" })).toBe("Password too short");
    expect(explainSignUp({ status: 500 })).toBe("Something went wrong. Try again.");
  });
});

describe("explainGoogle", () => {
  it("is offline with no status", () => {
    expect(explainGoogle({})).toBe(OFFLINE);
  });

  it("explains an unlinked account by code or by message", () => {
    expect(explainGoogle({ status: 400, code: "ACCOUNT_NOT_LINKED" })).toMatch(/link Google from Settings/);
    expect(explainGoogle({ status: 400, message: "account not linked" })).toMatch(/link Google from Settings/);
  });

  it("falls back to unavailable", () => {
    expect(explainGoogle({ status: 500 })).toBe("Google sign-in isn't available right now.");
  });
});
