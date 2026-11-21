import { describe, expect, it } from "vitest";

import { SORT_COLOURS } from "../../design/section-colours";
import { cubeColumns, toDoList, type ToDoInput } from "./to-do";

const members = [
  { userId: "me", name: "Dev" },
  { userId: "sofia", name: "Sofia" },
  { userId: "tom", name: "Tom" },
];

const leg = (no: number, placeName: string, arrive: string, leave: string, extra: Partial<ToDoInput["legs"][number]> = {}) => ({
  no,
  placeName,
  arrive,
  leave,
  nights: 1,
  hasStay: true,
  hasTravel: true,
  ...extra,
});

const base: ToDoInput = {
  moment: "set",
  today: "2026-10-20",
  over: false,
  viewerId: "me",
  members,
  markedUserIds: ["me", "sofia", "tom"],
  ideas: [],
  owe: [],
  bag: null,
  shared: [],
  legs: [leg(1, "Faro", "2026-10-22", "2026-10-24")],
};

const texts = (list: { text: string }[]) => list.map((g) => g.text);

describe("toDoList", () => {
  it("is empty when everything is sorted", () => {
    expect(toDoList(base).open).toEqual([]);
  });

  it("asks you for your days, and names who else has not marked theirs, while the trip has no dates", () => {
    const { open } = toDoList({ ...base, moment: "finding", markedUserIds: ["sofia"] });
    expect(open.map((g) => [g.mine, g.text])).toEqual([
      [true, "Mark the days you can do"],
      [false, "Tom has not marked any days"],
      [true, "The trip has no dates yet"],
    ]);
  });

  it("asks you to vote while there are ideas and no dates, and you have not voted", () => {
    const open = toDoList({ ...base, moment: "finding", ideas: [{ mine: false }, { mine: false }] }).open;
    expect(open[0]).toMatchObject({ mine: true, text: "Vote on where: 2 ideas", tab: "overview", anchor: "ideas" });
  });

  it("orders the list as the trip is planned: votes, days, dates, stays, your bag, shared packing, money (#704)", () => {
    const owe = [{ to: "Priya", amountMinor: 12000, currency: "GBP" as const }];
    const shared = [{ label: "Towels", claimed: false }];
    const bag = { total: 4, packed: 1 };
    const finding = toDoList({ ...base, moment: "finding", legs: [], markedUserIds: ["sofia", "tom"], ideas: [{ mine: false }], owe, shared, bag });
    expect(texts(finding.open)).toEqual([
      "Vote on where: 1 idea",
      "Mark the days you can do",
      "The trip has no dates yet",
      "3 things left to pack",
      "1 shared thing to bring",
      "You owe Priya £120.00",
    ]);
    const set = toDoList({ ...base, owe, shared, bag, legs: [leg(1, "Lisbon", "2026-10-24", "2026-10-25", { hasStay: false, hasTravel: false }), leg(2, "Porto", "2026-10-25", "2026-10-26", { hasTravel: false })] });
    expect(set.open.map((g) => g.kind)).toEqual(["stay", "travel", "packing", "packing", "money"]);
  });

  it("puts your own to do first within a step", () => {
    const { open } = toDoList({ ...base, moment: "finding", markedUserIds: ["tom"] });
    expect(open.slice(0, 2).map((g) => g.mine)).toEqual([true, false]);
  });

  it("says nowhere is picked while the trip has no dates and no ideas, and opens Ideas (#704)", () => {
    const fresh = { ...base, moment: "finding" as const, legs: [] };
    expect(toDoList(fresh).open[0]).toMatchObject({ mine: true, text: "Nowhere picked yet", tab: "overview", anchor: "ideas", action: "Add an idea" });
    expect(texts(toDoList({ ...fresh, ideas: [{ mine: true }] }).open)).not.toContain("Nowhere picked yet");
  });

  it("says nowhere is picked once the dates are set and no night has a place, and opens Days (#704)", () => {
    const { open, left } = toDoList({ ...base, legs: [] });
    expect(open.map((g) => [g.text, g.tab, g.action])).toEqual([["Nowhere picked yet", "days", "Plan the days"]]);
    expect(left).toBe(1);
    expect(toDoList({ ...base, moment: "started", over: true, legs: [] }).open).toEqual([]);
  });

  it("asks for the dates to be set while the trip has none (#704)", () => {
    const line = toDoList({ ...base, moment: "finding" }).open.find((g) => g.key === "set-dates");
    expect(line).toMatchObject({ kind: "days", text: "The trip has no dates yet", tab: "dates", action: "Set the dates" });
    expect(toDoList(base).open).toEqual([]);
  });

  it("gathers a route with no stay booked into one line, and names the hops with no travel (#704)", () => {
    const legs = [
      leg(1, "Lisbon", "2026-10-24", "2026-10-25", { hasStay: false }),
      leg(2, "Porto", "2026-10-25", "2026-10-26", { hasStay: false, hasTravel: false }),
      leg(3, "Faro", "2026-10-26", "2026-10-27", { hasStay: false }),
    ];
    const fresh = toDoList({ ...base, legs });
    expect(fresh.open.map((g) => [g.kind, g.text, g.sub, g.action])).toEqual([["stay", "3 stops to book", ["1 hop with no travel"], "Find a stay"]]);
    expect(texts(fresh.done)).toEqual(["Porto to Faro: travel set"]);
    const booking = toDoList({ ...base, legs: [{ ...legs[0], hasStay: true }, legs[1], legs[2]] });
    expect(texts(booking.open)).toEqual(["No stay booked in Porto", "No stay booked in Faro", "Lisbon to Porto: no travel set"]);
  });

  it("keeps every stop and hop on the meter while they share one line, so booking a stay never sends it back (ADR-033)", () => {
    const legs = [
      leg(1, "Lisbon", "2026-10-24", "2026-10-25", { hasStay: false }),
      leg(2, "Porto", "2026-10-25", "2026-10-26", { hasStay: false, hasTravel: false }),
      leg(3, "Faro", "2026-10-26", "2026-10-27", { hasStay: false }),
    ];
    const fresh = toDoList({ ...base, legs });
    const booking = toDoList({ ...base, legs: [{ ...legs[0], hasStay: true }, legs[1], legs[2]] });
    expect([fresh.done.length, fresh.left]).toEqual([1, 4]);
    expect([booking.done.length, booking.left]).toEqual([2, 3]);
  });

  it("sends every stay line to the booking links on Dates (#704)", () => {
    const legs = [
      leg(1, "Lisbon", "2026-10-24", "2026-10-25", { hasStay: false }),
      leg(2, "Porto", "2026-10-25", "2026-10-26", { hasStay: false }),
    ];
    const fresh = toDoList({ ...base, legs }).open;
    const booking = toDoList({ ...base, legs: [{ ...legs[0], hasStay: true }, legs[1]] }).open;
    expect([...fresh, ...booking].filter((g) => g.kind === "stay").map((g) => [g.tab, g.anchor])).toEqual([
      ["dates", "booking"],
      ["dates", "booking"],
    ]);
  });

  it("keeps the place name when the route is one stop", () => {
    const legs = [leg(1, "Lisbon", "2026-10-24", "2026-10-25", { hasStay: false })];
    expect(texts(toDoList({ ...base, legs }).open)).toEqual(["No stay booked in Lisbon"]);
  });

  it("says what is left in your own bag, before what the group shares (#704)", () => {
    const shared = [{ label: "Towels", claimed: false }];
    expect(toDoList({ ...base, shared, bag: { total: 5, packed: 4 } }).open.map((g) => [g.mine, g.text, g.tab, g.action])).toEqual([
      [true, "1 thing left to pack", "packing", "Pack"],
      [false, "1 shared thing to bring", "packing", "Bring"],
    ]);
    expect(texts(toDoList({ ...base, bag: { total: 5, packed: 5 } }).done)).toContain("Your bag is packed");
  });

  it("asks you to start a packing list only once the dates are set", () => {
    const empty = { total: 0, packed: 0 };
    expect(toDoList({ ...base, bag: empty }).open.map((g) => [g.text, g.action])).toEqual([["Nothing on your packing list", "Start my list"]]);
    expect(texts(toDoList({ ...base, moment: "finding", bag: empty }).open)).toEqual(["The trip has no dates yet"]);
  });

  it("stops asking about either bag once the trip is over", () => {
    const result = toDoList({ ...base, moment: "started", over: true, bag: { total: 3, packed: 0 }, shared: [{ label: "Towels", claimed: false }] });
    expect(result.open).toEqual([]);
  });

  it("asks a trip of one only to set the dates, with no days to mark and no group to wait for (rule 4)", () => {
    const solo = { ...base, moment: "finding" as const, members: [members[0]] };
    const unmarked = toDoList({ ...solo, markedUserIds: [] });
    expect(texts(unmarked.open)).toEqual(["The trip has no dates yet"]);
    expect([unmarked.left, unmarked.done.length]).toEqual([1, 0]);
  });

  it("has no group check for votes on a trip of one (rule 4)", () => {
    const solo = { ...base, moment: "finding" as const, members: [members[0]], ideas: [{ mine: true }], nudges: { dates: [], money: [], ideas: [] } };
    expect(texts(toDoList(solo).done)).toEqual(["You voted on where"]);
  });

  it("draws nowhere picked yet as Ideas before the dates are set, and as Days, where it leads, after (Aidan, #704)", () => {
    const before = toDoList({ ...base, moment: "finding", legs: [] }).open[0];
    const after = toDoList({ ...base, legs: [] }).open[0];
    expect([before.kind, after.kind]).toEqual(["ideas", "plan"]);
    expect([SORT_COLOURS[before.kind], SORT_COLOURS[after.kind]]).toEqual(["blue", "green"]);
  });

  it("gathers what nobody is bringing into one line, with no names under it, like your bag (#704)", () => {
    const one = toDoList({ ...base, shared: [{ label: "First-aid kit", claimed: false }, { label: "Towels", claimed: true }] });
    expect(one.open.map((g) => [g.text, g.sub])).toEqual([["1 shared thing to bring", undefined]]);
    const two = toDoList({ ...base, shared: [{ label: "First-aid kit", claimed: false }, { label: "Speaker", claimed: false }] });
    expect(two.open.map((g) => [g.text, g.sub])).toEqual([["2 shared things to bring", undefined]]);
  });

  it("names a stay not booked and a leg with no travel, but only for stops still ahead", () => {
    const legs = [
      leg(1, "Lisbon", "2026-10-24", "2026-10-25"),
      leg(2, "Barcelona", "2026-10-25", "2026-10-26", { hasStay: false, hasTravel: false }),
    ];
    expect(toDoList({ ...base, legs }).open.map((g) => g.text)).toEqual([
      "No stay booked in Barcelona",
      "Lisbon to Barcelona: no travel set",
    ]);
    const started = toDoList({ ...base, moment: "started", today: "2026-10-24", legs }).open.map((g) => g.text);
    expect(started).toEqual(["Lisbon to Barcelona: no travel set"]);
  });

  it("gives a stay's dates and nights as separate parts, so a list can line them up", () => {
    const legs = [leg(1, "Lisbon", "2026-10-24", "2026-10-26", { hasStay: false, nights: 2 })];
    expect(toDoList({ ...base, legs }).open[0].sub).toEqual(["2 nights", "24–26 Oct"]);
  });

  it("counts every free packing thing towards the meter, though they share one line", () => {
    const result = toDoList({ ...base, shared: [{ label: "Kit", claimed: false }, { label: "Speaker", claimed: false }] });
    expect([result.open.length, result.left]).toEqual([1, 2]);
  });

  it("lists what is done, in words, so the done count can open", () => {
    const legs = [
      leg(1, "Lisbon", "2026-10-24", "2026-10-26", { nights: 2 }),
      leg(2, "Barcelona", "2026-10-26", "2026-10-27"),
    ];
    const { done } = toDoList({ ...base, legs, shared: [{ label: "Towels", claimed: true }] });
    expect(done.map((d) => [d.text, d.sub])).toEqual([
      ["Stay booked in Lisbon", ["2 nights", "24–26 Oct"]],
      ["Stay booked in Barcelona", ["1 night", "26–27 Oct"]],
      ["Lisbon to Barcelona: travel set", ["Mon 26 Oct"]],
      ["Towels", ["Someone is bringing it"]],
    ]);
  });

  it("says what each line is about, so a surface can draw its icon", () => {
    const legs = [leg(1, "Lisbon", "2026-10-24", "2026-10-25", { hasStay: false }), leg(2, "Porto", "2026-10-25", "2026-10-26")];
    const { open, done } = toDoList({ ...base, legs, owe: [{ to: "Priya", amountMinor: 500, currency: "GBP" }] });
    expect([...open, ...done].map((g) => g.kind)).toEqual(["stay", "money", "stay", "travel"]);
  });

  describe("nudge lines (#705)", () => {
    const person = (userId: string, name: string, nudged = false) => ({ userId, name, nudged });
    const nudges = {
      dates: [person("sofia", "Sofia"), person("tom", "Tom", true)],
      money: [person("sofia", "Sofia")],
      ideas: [person("tom", "Tom")],
    };

    it("puts the people to nudge on the days line, with Nudge all", () => {
      const gap = toDoList({ ...base, moment: "finding", markedUserIds: ["me"], nudges }).open[0];
      expect(gap).toMatchObject({ key: "their-days", action: "Nudge all" });
      expect(gap.nudge).toEqual({ task: "dates", people: nudges.dates, line: "2 people have not marked any days" });
    });

    it("adds a line for each person who owes you and each who has not voted", () => {
      const { open } = toDoList({ ...base, moment: "finding", ideas: [{ mine: true }], nudges });
      const lines = open.filter((g) => g.nudge).map((g) => [g.key, g.kind, g.text, g.nudge?.line]);
      expect(lines).toEqual([
        ["their-votes", "ideas", "Tom has not voted on where", "1 person has not voted on where"],
        ["owed", "money", "Sofia owes you", "1 person owes you"],
      ]);
    });

    it("says everyone has voted once nobody is left to nudge", () => {
      const { done } = toDoList({ ...base, moment: "finding", ideas: [{ mine: true }], nudges: { ...nudges, ideas: [] } });
      expect(done.map((d) => d.text)).toContain("Everyone has voted on where");
    });

    it("shortens a long list of names on a line", () => {
      const many = ["Ann", "Bo", "Cy", "Di"].map((name) => ({ userId: name, name }));
      const { open } = toDoList({ ...base, moment: "finding", members: [...members, ...many], markedUserIds: ["me", "sofia", "tom"] });
      expect(open[0].text).toBe("Ann, Bo and 2 others have not marked any days");
    });
  });

  it("says when you and everyone else have marked your days, and when you have voted", () => {
    const { done } = toDoList({ ...base, moment: "finding", ideas: [{ mine: true }] });
    expect(done.map((d) => d.text)).toEqual(["You voted on where", "You marked your days", "Everyone has marked their days"]);
  });
});

describe("cubeColumns", () => {
  it("keeps up to 12 cubes on one row and wraps more onto two", () => {
    expect([cubeColumns(4), cubeColumns(12), cubeColumns(13), cubeColumns(24)]).toEqual([4, 12, 7, 12]);
  });
});
