import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
vi.mock("better-auth/react", () => ({ createAuthClient: () => ({ getSession }) }));

const { renewSessionCache } = await import("./auth-client");

beforeEach(() => getSession.mockReset());

describe("renewSessionCache", () => {
  it("asks for a fresh read, past the cookie cache", async () => {
    getSession.mockResolvedValue({ data: null, error: null });
    await renewSessionCache();
    expect(getSession).toHaveBeenCalledWith({ query: { disableCookieCache: true } });
  });

  it("throws when the read fails, so the next check tries again", async () => {
    getSession.mockResolvedValue({ data: null, error: { message: "Too many requests" } });
    await expect(renewSessionCache()).rejects.toThrow("Too many requests");
  });
});
