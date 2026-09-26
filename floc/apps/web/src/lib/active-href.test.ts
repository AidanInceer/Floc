import { describe, expect, it } from "vitest";

import { activeHref } from "./active-href";

const HREFS = ["/explore", "/trips", "/friends"];

describe("activeHref", () => {
  it("matches the exact path", () => {
    expect(activeHref("/trips", HREFS)).toBe("/trips");
  });

  it("matches a page below the link", () => {
    expect(activeHref("/explore/city-breaks", HREFS)).toBe("/explore");
  });

  it("does not match a path that only starts with the same letters", () => {
    expect(activeHref("/tripsy", HREFS)).toBeNull();
  });

  it("is null when no link holds the page", () => {
    expect(activeHref("/settings", HREFS)).toBeNull();
  });

  it("puts a trip under Trips", () => {
    expect(activeHref("/trip/12/money", HREFS, { "/trip/": "/trips" })).toBe("/trips");
  });
});
