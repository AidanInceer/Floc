import { describe, expect, it } from "vitest";

import { screenView } from "./page-views";

describe("a screen view on the phone", () => {
  it("is not sent without a yes to analytics", () => {
    expect(screenView("/trips", "android", { functional: true, analytics: false })).toBeNull();
  });

  it("names the screen and the kind of phone after a yes", () => {
    const yes = { functional: false, analytics: true };
    expect(screenView("/trip/12/money", "ios", yes)).toEqual({ name: "page.view", path: "/trip/12/money", surface: "ios" });
    expect(screenView("/trips", "android", yes)?.surface).toBe("android");
  });
});
