import { describe, expect, it } from "vitest";

import { cubeColumns, leftToSort, type LeftToSortInput } from "./left-to-sort";

const members = [
  { userId: "me", name: "Dev" },
  { userId: "sofia", name: "Sofia" },
  { userId: "tom", name: "Tom" },
];

const base: LeftToSortInput = {
  moment: "set",
  today: "2026-10-20",
  viewerId: "me",
  members,
  markedUserIds: ["me", "sofia", "tom"],
  ideas: [],
  owe: [],
  shared: [],
  legs: [],
};

const leg = (no: number, placeName: string, arrive: string, leave: string, extra: Partial<LeftToSortInput["legs"][number]> = {}) => ({
  no,
  placeName,
  arrive,
  leave,
  nights: 1,
  hasStay: true,
  hasTravel: true,
  ...extra,
});

describe("leftToSort", () => {
  it("is empty when everything is sorted", () => {
    expect(leftToSort(base).open).toEqual([]);
  });

  it("asks you for your days, and names who else has not marked theirs, while the trip has no dates", () => {
    const { open } = leftToSort({ ...base, moment: "finding", markedUserIds: ["sofia"] });
    expect(open.map((g) => [g.mine, g.text])).toEqual([
      [true, "Mark the days you can do"],
      [false, "Tom has not marked any days"],
    ]);
  });

  it("asks you to vote while there are ideas and no dates, and you have not voted", () => {
    const open = leftToSort({ ...base, moment: "finding", ideas: [{ mine: false }, { mine: false }] }).open;
    expect(open[0]).toMatchObject({ mine: true, text: "Vote on where: 2 ideas", tab: "ideas" });
  });

  it("puts what you owe first", () => {
    const { open } = leftToSort({
      ...base,
      owe: [{ to: "Priya", amountMinor: 12000, currency: "GBP" }],
      legs: [leg(1, "Lisbon", "2026-10-24", "2026-10-25", { hasStay: false })],
    });
    expect(open.map((g) => g.text)).toEqual(["You owe Priya £120.00", "No stay booked in Lisbon"]);
    expect(open[0]).toMatchObject({ mine: true, tab: "money", action: "Settle up" });
  });

  it("gathers what nobody is bringing into one line", () => {
    const one = leftToSort({ ...base, shared: [{ label: "First-aid kit", claimed: false }, { label: "Towels", claimed: true }] });
    expect(one.open.map((g) => g.text)).toEqual(["First-aid kit is up for grabs"]);
    const two = leftToSort({ ...base, shared: [{ label: "First-aid kit", claimed: false }, { label: "Speaker", claimed: false }] });
    expect(two.open.map((g) => [g.text, g.sub])).toEqual([["2 things are up for grabs", ["First-aid kit, Speaker"]]]);
  });

  it("names a stay not booked and a leg with no travel, but only for stops still ahead", () => {
    const legs = [
      leg(1, "Lisbon", "2026-10-24", "2026-10-25", { hasStay: false }),
      leg(2, "Barcelona", "2026-10-25", "2026-10-26", { hasStay: false, hasTravel: false }),
    ];
    expect(leftToSort({ ...base, legs }).open.map((g) => g.text)).toEqual([
      "No stay booked in Lisbon",
      "No stay booked in Barcelona",
      "Lisbon to Barcelona: no travel set",
    ]);
    const started = leftToSort({ ...base, moment: "started", today: "2026-10-24", legs }).open.map((g) => g.text);
    expect(started).toEqual(["Lisbon to Barcelona: no travel set"]);
  });

  it("gives a stay's dates and nights as separate parts, so a list can line them up", () => {
    const legs = [leg(1, "Lisbon", "2026-10-24", "2026-10-26", { hasStay: false, nights: 2 })];
    expect(leftToSort({ ...base, legs }).open[0].sub).toEqual(["2 nights", "24–26 Oct"]);
  });

  it("counts every free packing thing towards the meter, though they share one line", () => {
    const result = leftToSort({ ...base, shared: [{ label: "Kit", claimed: false }, { label: "Speaker", claimed: false }] });
    expect([result.open.length, result.left]).toEqual([1, 2]);
  });

  it("lists what is already sorted, in words, so the sorted count can open", () => {
    const legs = [
      leg(1, "Lisbon", "2026-10-24", "2026-10-26", { nights: 2 }),
      leg(2, "Barcelona", "2026-10-26", "2026-10-27"),
    ];
    const { done } = leftToSort({ ...base, legs, shared: [{ label: "Towels", claimed: true }] });
    expect(done.map((d) => [d.text, d.sub])).toEqual([
      ["Towels", ["Someone is bringing it"]],
      ["Stay booked in Lisbon", ["2 nights", "24–26 Oct"]],
      ["Stay booked in Barcelona", ["1 night", "26–27 Oct"]],
      ["Lisbon to Barcelona: travel set", ["Mon 26 Oct"]],
    ]);
  });

  it("says what each line is about, so a surface can draw its icon", () => {
    const legs = [leg(1, "Lisbon", "2026-10-24", "2026-10-25", { hasStay: false }), leg(2, "Porto", "2026-10-25", "2026-10-26")];
    const { open, done } = leftToSort({ ...base, legs, owe: [{ to: "Priya", amountMinor: 500, currency: "GBP" }] });
    expect([...open, ...done].map((g) => g.kind)).toEqual(["money", "stay", "stay", "travel"]);
  });

  it("says when you and everyone else have marked your days, and when you have voted", () => {
    const { done } = leftToSort({ ...base, moment: "finding", ideas: [{ mine: true }] });
    expect(done.map((d) => d.text)).toEqual(["You marked your days", "Everyone has marked their days", "You voted on where"]);
  });
});

describe("cubeColumns", () => {
  it("keeps up to 12 cubes on one row and wraps more onto two", () => {
    expect([cubeColumns(4), cubeColumns(12), cubeColumns(13), cubeColumns(24)]).toEqual([4, 12, 7, 12]);
  });
});
