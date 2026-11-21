import { describe, expect, it } from "vitest";

import { nudgeHref, nudgeLine, nudgePlan, nudgeTargets, readNudgeTask, type NudgeTargetsInput } from "./nudge";

const members = [
  { userId: "me", name: "Aidan" },
  { userId: "sam", name: "Sam" },
  { userId: "jo", name: "Jo" },
  { userId: "alex", name: "Alex" },
];

const base: NudgeTargetsInput = {
  viewerId: "me",
  moment: "finding",
  members,
  recent: [],
};

const ids = (people: { userId: string }[]) => people.map((p) => p.userId);

describe("nudgeTargets", () => {
  it("offers everyone else who has not marked days, never you (rule 9)", () => {
    const t = nudgeTargets({ ...base, markedUserIds: ["me", "alex"] });
    expect(ids(t.dates)).toEqual(["sam", "jo"]);
  });

  it("offers no days nudge once the trip has dates", () => {
    expect(nudgeTargets({ ...base, moment: "set", markedUserIds: [] }).dates).toEqual([]);
  });

  it("offers a vote nudge only while there are ideas and no dates, to those who voted on none", () => {
    expect(ids(nudgeTargets({ ...base, ideas: { count: 2, voterIds: ["me", "jo"] } }).ideas)).toEqual(["sam", "alex"]);
    expect(nudgeTargets({ ...base, ideas: { count: 0, voterIds: [] } }).ideas).toEqual([]);
    expect(nudgeTargets({ ...base, moment: "set", ideas: { count: 2, voterIds: [] } }).ideas).toEqual([]);
  });

  it("offers a settle-up nudge only to people who owe you, in any trip state", () => {
    expect(ids(nudgeTargets({ ...base, moment: "started", owedBy: ["jo", "ghost"] }).money)).toEqual(["jo"]);
  });

  it("gives nothing for a task whose data the caller did not load", () => {
    expect(nudgeTargets(base)).toEqual({ dates: [], money: [], ideas: [] });
  });

  it("marks a person nudged for that task in the last day, by anyone", () => {
    const t = nudgeTargets({ ...base, markedUserIds: [], owedBy: ["sam"], recent: [{ task: "dates", toUserId: "sam" }] });
    expect(t.dates.find((p) => p.userId === "sam")?.nudged).toBe(true);
    expect(t.dates.find((p) => p.userId === "jo")?.nudged).toBe(false);
    expect(t.money[0].nudged).toBe(false);
  });
});

describe("nudgePlan", () => {
  const targets = nudgeTargets({ ...base, markedUserIds: [], recent: [{ task: "dates", toUserId: "jo" }] });

  it("sends to each person asked who still has the task and was not nudged today", () => {
    expect(nudgePlan(targets.dates, ["sam", "jo", "alex", "me", "stranger"], 0, 20)).toEqual({ send: ["sam", "alex"], capped: false });
  });

  it("stops at the daily cap and says so", () => {
    expect(nudgePlan(targets.dates, ["sam", "alex"], 19, 20)).toEqual({ send: ["sam"], capped: true });
    expect(nudgePlan(targets.dates, ["sam"], 20, 20)).toEqual({ send: [], capped: true });
  });

  it("asks each person once, however often they are named", () => {
    expect(nudgePlan(targets.dates, ["sam", "sam"], 0, 20).send).toEqual(["sam"]);
  });
});

describe("nudge words", () => {
  it("reads only the three tasks", () => {
    expect(readNudgeTask("ideas")).toBe("ideas");
    expect(readNudgeTask("notes")).toBeNull();
    expect(readNudgeTask(undefined)).toBeNull();
  });

  it("counts the people a line names", () => {
    expect(nudgeLine("dates", 3)).toBe("3 people have not marked any days");
    expect(nudgeLine("dates", 1)).toBe("1 person has not marked any days");
    expect(nudgeLine("money", 2)).toBe("2 people owe you");
    expect(nudgeLine("money", 1)).toBe("1 person owes you");
    expect(nudgeLine("ideas", 2)).toBe("2 people have not voted on where");
  });

  it("opens the page where the task is done", () => {
    expect(nudgeHref(7, "dates")).toBe("/trip/7/dates");
    expect(nudgeHref(7, "money")).toBe("/trip/7/money");
    expect(nudgeHref(7, "ideas")).toBe("/trip/7/overview#ideas");
  });
});
