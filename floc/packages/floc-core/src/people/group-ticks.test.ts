import { describe, expect, it } from "vitest";

import { firstName, firstNames, groupTick, peopleCount, toggleGroup, toggleTripPeople } from "./group-ticks";

describe("groupTick", () => {
  it("is all when every member is ticked", () => {
    expect(groupTick(["a", "b"], new Set(["a", "b", "c"]))).toBe("all");
  });

  it("is some when only part of the group is ticked", () => {
    expect(groupTick(["a", "b"], new Set(["b"]))).toBe("some");
  });

  it("is none when no member is ticked, or the group is empty", () => {
    expect(groupTick(["a", "b"], new Set(["c"]))).toBe("none");
    expect(groupTick([], new Set(["c"]))).toBe("none");
  });
});

describe("toggleGroup", () => {
  it("ticks every member when the group is not all ticked", () => {
    expect([...toggleGroup(new Set(["a"]), ["a", "b"])].sort()).toEqual(["a", "b"]);
  });

  it("unticks every member when the group is all ticked, and keeps the others", () => {
    expect([...toggleGroup(new Set(["a", "b", "c"]), ["a", "b"])]).toEqual(["c"]);
  });

  it("stops at the cap", () => {
    expect(toggleGroup(new Set(["x"]), ["a", "b", "c"], 2).size).toBe(2);
  });
});

describe("names", () => {
  it("takes the first word of a name", () => {
    expect(firstName("  Priya Shah ")).toBe("Priya");
    expect(firstName("Mo")).toBe("Mo");
  });

  it("joins first names the way the Overview joins who is going", () => {
    expect(firstNames(["Priya Shah", "Nadia Ali", "Mei Chen"])).toBe("Priya, Nadia and Mei");
    expect(firstNames(["A x", "B x", "C x", "D x", "E x"])).toBe("A, B, C and 2 more");
  });

  it("counts people in words", () => {
    expect(peopleCount(1)).toBe("1 person");
    expect(peopleCount(3)).toBe("3 people");
  });
});

describe("trip people selection", () => {
  it("counts a person once across overlapping groups and keeps a group partial after unticking one person", () => {
    const first = toggleTripPeople({ ticked: new Set(), groups: new Set() }, ["a", "b"], 1);
    const overlap = toggleTripPeople(first, ["b", "c"], 2);
    expect([...overlap.ticked]).toEqual(["a", "b", "c"]);

    const partial = toggleTripPeople(overlap, ["a"]);
    expect(groupTick(["a", "b"], partial.ticked)).toBe("some");
    expect([...partial.groups]).toEqual([1, 2]);
  });

  it("drops the group from the used set when its button clears the selection", () => {
    const picked = toggleTripPeople({ ticked: new Set(["a"]), groups: new Set([1]) }, ["a"], 1);
    expect([...picked.groups]).toEqual([]);
    expect([...picked.ticked]).toEqual([]);
  });
});
