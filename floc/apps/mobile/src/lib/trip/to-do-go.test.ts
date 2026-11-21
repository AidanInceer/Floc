import { describe, expect, it } from "vitest";

import { bagOf, toDoGo } from "./to-do-go";

describe("toDoGo", () => {
  it("opens another tab for a line that lives there", () => {
    expect(toDoGo({ tab: "dates", anchor: "booking" })).toEqual({ tab: "dates" });
  });

  it("scrolls to the ideas for a line about where to go (#704)", () => {
    expect(toDoGo({ tab: "overview", anchor: "ideas" })).toEqual({ section: "ideas" });
  });
});

describe("bagOf", () => {
  it("counts the lines in your own bag and those packed (#704)", () => {
    expect(bagOf([{ packed: true }, { packed: false }])).toEqual({ total: 2, packed: 1 });
  });
});
