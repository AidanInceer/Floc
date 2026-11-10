import { describe, expect, it, vi } from "vitest";

import { SIGN_OUT_FAILED, trySignOut } from "./sign-out";

describe("trySignOut", () => {
  it("reports no problem when the server ends the session", async () => {
    expect(await trySignOut(async () => ({ error: null }), async () => {})).toBeNull();
  });

  it("clears the offline notes copies once signed out, and keeps them when sign-out failed (#582)", async () => {
    const clear = vi.fn(async () => {});
    await trySignOut(async () => ({ error: { status: 403 } }), clear);
    expect(clear).not.toHaveBeenCalled();
    await trySignOut(async () => ({ error: null }), clear);
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it("says so when the server refuses, so the page does not look signed out", async () => {
    expect(await trySignOut(async () => ({ error: { status: 403 } }))).toBe(SIGN_OUT_FAILED);
  });

  it("says so when Floc cannot be reached", async () => {
    expect(
      await trySignOut(async () => {
        throw new Error("offline");
      }),
    ).toBe(SIGN_OUT_FAILED);
  });
});
