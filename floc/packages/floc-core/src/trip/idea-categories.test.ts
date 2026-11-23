import { describe, expect, it } from "vitest";

import {
  activeIdeaTab,
  ALL_IDEAS,
  IDEA_CATEGORY_MAX,
  ideaCategoryLabel,
  ideaCategoryTabs,
  ideaEventType,
  ideasIn,
  readIdeaCategory,
} from "./idea-categories";

describe("readIdeaCategory", () => {
  it("keeps a house category by its key or its name", () => {
    expect(readIdeaCategory("food")).toBe("food");
    expect(readIdeaCategory(" Drinks ")).toBe("drinks");
  });

  it("treats nothing, a blank and the word All as Other", () => {
    expect(readIdeaCategory(null)).toBe("other");
    expect(readIdeaCategory("   ")).toBe("other");
    expect(readIdeaCategory("all")).toBe("other");
  });

  it("keeps a member's own category, tidied and capped", () => {
    expect(readIdeaCategory("  Day   trips ")).toBe("Day Trips");
    expect(readIdeaCategory("x".repeat(IDEA_CATEGORY_MAX + 5))).toHaveLength(IDEA_CATEGORY_MAX);
  });

  it("capitalises the first letter of each word and lowers the rest", () => {
    expect(readIdeaCategory("TEST")).toBe("Test");
    expect(readIdeaCategory("beach")).toBe("Beach");
    expect(readIdeaCategory("dAY tRIPS")).toBe("Day Trips");
    expect(readIdeaCategory("must-see")).toBe("Must-See");
    expect(readIdeaCategory("wine & dine")).toBe("Wine & Dine");
    expect(readIdeaCategory("bars/pubs")).toBe("Bars/Pubs");
  });

  it("keeps an apostrophe inside its word and handles accented letters", () => {
    expect(readIdeaCategory("KID'S CLUB")).toBe("Kid's Club");
    expect(readIdeaCategory("école d'été")).toBe("École D'été");
  });

  it("stays within the cap when a capital is longer than its letter", () => {
    expect(readIdeaCategory("ß".repeat(IDEA_CATEGORY_MAX)).length).toBeLessThanOrEqual(IDEA_CATEGORY_MAX);
  });

  it("reads a house category in any case as that category", () => {
    expect(readIdeaCategory("FOOD")).toBe("food");
    expect(readIdeaCategory("ALL")).toBe("other");
  });
});

describe("ideaCategoryLabel", () => {
  it("names a house category and shows a member's own", () => {
    expect(ideaCategoryLabel("activities")).toBe("Activities");
    expect(ideaCategoryLabel("Beaches")).toBe("Beaches");
  });
});

describe("ideaEventType", () => {
  it("turns each category into the event type Days draws", () => {
    expect(ideaEventType("travel")).toBe("transport");
    expect(ideaEventType("activities")).toBe("activity");
    expect(ideaEventType("food")).toBe("food");
    expect(ideaEventType("drinks")).toBe("food");
    expect(ideaEventType("other")).toBe("other");
    expect(ideaEventType("Beaches")).toBe("other");
  });
});

describe("ideaCategoryTabs", () => {
  const rows = [{ category: "food" }, { category: "food" }, { category: "Beaches" }, { category: "beaches" }, { category: "Art" }];

  it("starts with All, then the house categories, then members' own in name order", () => {
    expect(ideaCategoryTabs(rows).map((t) => t.label)).toEqual(["All", "Travel", "Activities", "Food", "Drinks", "Other", "Art", "Beaches"]);
  });

  it("counts each tab and folds a member's category whatever its case", () => {
    const tabs = ideaCategoryTabs(rows);
    expect(tabs.find((t) => t.id === ALL_IDEAS)?.count).toBe(5);
    expect(tabs.find((t) => t.id === "food")?.count).toBe(2);
    expect(tabs.find((t) => t.label === "Beaches")?.count).toBe(2);
  });

  it("shows a category someone has just made, before it holds an idea", () => {
    expect(ideaCategoryTabs(rows, ["Museums"]).find((t) => t.label === "Museums")?.count).toBe(0);
  });

  it("does not repeat a made category that already exists", () => {
    expect(ideaCategoryTabs(rows, ["ART", "food"]).filter((t) => t.label.toLowerCase() === "art")).toHaveLength(1);
    expect(ideaCategoryTabs(rows, ["food"]).filter((t) => t.id === "food")).toHaveLength(1);
  });
});

describe("activeIdeaTab", () => {
  const tabs = ideaCategoryTabs([{ category: "Beaches" }]);

  it("keeps a tab that still exists, whatever its case", () => {
    expect(activeIdeaTab(tabs, "food")).toBe("food");
    expect(activeIdeaTab(tabs, "beaches")).toBe("beaches");
  });

  it("falls back to All when the chosen category has gone", () => {
    expect(activeIdeaTab(tabs, "Museums")).toBe(ALL_IDEAS);
  });
});

describe("ideasIn", () => {
  const rows = [{ id: 1, category: "food" }, { id: 2, category: "Beaches" }, { id: 3, category: "beaches" }];

  it("keeps everything under All", () => {
    expect(ideasIn(rows, ALL_IDEAS).map((r) => r.id)).toEqual([1, 2, 3]);
  });

  it("keeps one category, whatever its case", () => {
    expect(ideasIn(rows, "Beaches").map((r) => r.id)).toEqual([2, 3]);
    expect(ideasIn(rows, "food").map((r) => r.id)).toEqual([1]);
  });
});
