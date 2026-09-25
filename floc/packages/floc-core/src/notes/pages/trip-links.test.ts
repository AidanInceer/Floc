import { describe, expect, it } from "vitest";

import { findLinks, isLinkKind, showLink, type TripLinkItem } from "./trip-links";

const items: TripLinkItem[] = [
  { kind: "file", id: 1, label: "Boarding passes", detail: "PDF" },
  { kind: "day", id: 2, label: "Sun 1 Nov", detail: "Day 1 · Lisbon" },
  { kind: "event", id: 3, label: "Train to Lagos", detail: "Tue 3 Nov, 09:05" },
  { kind: "expense", id: 4, label: "Lagos flat", detail: "€960" },
];

describe("findLinks", () => {
  it("lists everything in kind order with no query", () => {
    expect(findLinks(items, " ").map((item) => item.id)).toEqual([2, 3, 4, 1]);
  });

  it("matches the name, the detail or the group", () => {
    expect(findLinks(items, "lagos").map((item) => item.id)).toEqual([3, 4]);
    expect(findLinks(items, "lisbon").map((item) => item.id)).toEqual([2]);
    expect(findLinks(items, "money").map((item) => item.id)).toEqual([4]);
    expect(findLinks(items, "nothing like it")).toEqual([]);
  });
});

describe("showLink", () => {
  it("shows the current name", () => {
    expect(showLink({ kind: "event", id: 3, label: "Old name" }, items)).toEqual({ label: "Train to Lagos", removed: false });
  });

  it("shows the last name seen, removed, once the thing has gone", () => {
    expect(showLink({ kind: "day", id: 3, label: "Tram 28" }, items)).toEqual({ label: "Tram 28", removed: true });
  });
});

describe("isLinkKind", () => {
  it("knows the six kinds", () => {
    expect(["day", "event", "place", "expense", "packing", "file"].every(isLinkKind)).toBe(true);
    expect([null, 3, "trip"].some(isLinkKind)).toBe(false);
  });
});
