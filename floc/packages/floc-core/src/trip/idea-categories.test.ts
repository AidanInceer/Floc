import { describe, expect, it } from "vitest";

import {
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
    expect(readIdeaCategory("  Day   trips ")).toBe("Day trips");
    expect(readIdeaCategory("x".repeat(IDEA_CATEGORY_MAX + 5))).toHaveLength(IDEA_CATEGORY_MAX);
  });
});

describe("ideaCategoryLabel", () => {
  it("names a house category and shows a member's own as written", () => {
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
