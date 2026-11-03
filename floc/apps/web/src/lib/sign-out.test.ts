import { describe, expect, it } from "vitest";

import { SIGN_OUT_FAILED, trySignOut } from "./sign-out";

describe("trySignOut", () => {
  it("reports no problem when the server ends the session", async () => {
    expect(await trySignOut(async () => ({ error: null }))).toBeNull();
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
