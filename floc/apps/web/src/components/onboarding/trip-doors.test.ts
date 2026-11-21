import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TripDoors } from "./trip-doors";

describe("the ways to start on an empty My trips (#707, ADR-067)", () => {
  it("offers only what the Name field above cannot: Explore and an invite link", () => {
    const html = renderToStaticMarkup(createElement(TripDoors));
    expect(html).toContain("Borrow one from Explore");
    expect(html).toContain("Got a link?");
    expect(html).not.toContain("Name a trip");
  });
});
