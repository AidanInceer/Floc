import { describe, expect, it } from "vitest";

import { groupStatuses, owingUserIds } from "./group-status";

describe("owingUserIds", () => {
  it("names each person with a balance once, whatever the currencies", () => {
    const balances = {
      GBP: { ada: 500, mo: -500, sam: 0 },
      EUR: { ada: -200, mo: 200 },
    };
    expect(owingUserIds(balances).sort()).toEqual(["ada", "mo"]);
  });

  it("is nobody once everything is settled", () => {
    expect(owingUserIds({ GBP: { ada: 0, mo: 0 } })).toEqual([]);
  });
});

describe("groupStatuses", () => {
  it("gives each person the words for what they still owe the group", () => {
    const statuses = groupStatuses({ needDates: ["mo"], owing: ["mo", "ada"] });
    expect(statuses.get("mo")).toEqual(["Dates to add", "Settling up"]);
    expect(statuses.get("ada")).toEqual(["Settling up"]);
  });

  it("says nothing about someone with nothing outstanding", () => {
    expect(groupStatuses({ needDates: [], owing: ["ada"] }).get("sam")).toBeUndefined();
  });
});
