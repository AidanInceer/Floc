import { describe, expect, it } from "vitest";

import { pushTap } from "./push-tap";

describe("pushTap", () => {
  it("reads where a push goes and which notifications it carries", () => {
    expect(pushTap({ href: "/trip/7/overview", ids: [1, 2] })).toEqual({ route: "/trip/7", ids: [1, 2] });
  });

  it("ignores a push that is not one of ours", () => {
    expect(pushTap(undefined)).toBeNull();
    expect(pushTap({ href: 3 })).toBeNull();
    expect(pushTap({ href: "https://evil.example" })).toBeNull();
  });

  it("drops ids that are not numbers", () => {
    expect(pushTap({ href: "/inbox", ids: [1, "x"] })).toEqual({ route: "/inbox", ids: [1] });
    expect(pushTap({ href: "/inbox" })).toEqual({ route: "/inbox", ids: [] });
  });
});
