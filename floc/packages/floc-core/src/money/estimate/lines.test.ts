import { describe, expect, it } from "vitest";

import { EXPENSE_CATEGORIES } from "../expense-category";
import { ESTIMATE_LINES, lineOfCategory } from "./lines";

describe("lineOfCategory", () => {
  it.each([
    ["flights", "flights"],
    ["lodging", "stay"],
    ["food", "food"],
    ["drinks", "food"],
    ["groceries", "food"],
    ["activity", "activities"],
    ["transport", "transport"],
    ["fuel", "transport"],
    ["shopping", "other"],
    ["health", "other"],
    ["fees", "other"],
    ["other", "other"],
  ] as const)("files %s under %s", (category, line) => {
    expect(lineOfCategory(category)).toBe(line);
  });

  it("files every expense category somewhere", () => {
    const homes = new Set<string>([...ESTIMATE_LINES, "other"]);
    for (const c of EXPENSE_CATEGORIES) expect(homes.has(lineOfCategory(c))).toBe(true);
  });
});
