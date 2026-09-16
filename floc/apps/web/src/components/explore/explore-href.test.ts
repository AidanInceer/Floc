import { describe, expect, it } from "vitest";

import { exploreHref } from "@/components/explore/explore-href";

describe("exploreHref", () => {
  it("is bare for the defaults", () => {
    expect(exploreHref({ region: null, sort: "price", showAll: false })).toBe("/explore");
  });

  it("keeps region, sort and show-all together", () => {
    expect(exploreHref({ region: "Europe", sort: "longest", showAll: true })).toBe(
      "/explore?region=Europe&sort=longest&all=1",
    );
  });

  it("leaves the default sort out of the URL", () => {
    expect(exploreHref({ region: "Asia", sort: "price", showAll: false })).toBe("/explore?region=Asia");
  });
});
