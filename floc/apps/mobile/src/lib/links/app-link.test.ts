import { describe, expect, it } from "vitest";

import { appLinkPath } from "./app-link";

const host = "floc.up.railway.app";

describe("appLinkPath", () => {
  it("opens a website link to a trip at the phone's own route", () => {
    expect(appLinkPath(`https://${host}/trip/4/overview`, host)).toBe("/trip/4");
    expect(appLinkPath(`https://${host}/trip/4/money?from=email`, host)).toBe("/trip/4/money");
  });

  it("maps a bare web path the same way", () => {
    expect(appLinkPath("/trip/4/overview", host)).toBe("/trip/4");
  });

  it("leaves a link to anywhere else alone", () => {
    expect(appLinkPath("https://example.com/trip/4/money", host)).toBe("https://example.com/trip/4/money");
    expect(appLinkPath("floc://reset-password?token=abc", host)).toBe("floc://reset-password?token=abc");
  });
});
