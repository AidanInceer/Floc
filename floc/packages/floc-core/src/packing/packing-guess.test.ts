import { describe, expect, it } from "vitest";

import { generatePackingList } from "./packing-catalogue";
import { guessPackCategory } from "./packing-guess";

describe("guessPackCategory", () => {
  it("files every catalogue item where auto packing files it", () => {
    const all = generatePackingList({ nights: 7, climate: { hot: true, cold: true, wet: true }, tier: "balanced" });
    for (const item of all) expect([item.label, guessPackCategory(item.label)]).toEqual([item.label, item.category]);
  });

  it("reads the words a person types, in any case and in the plural", () => {
    expect(guessPackCategory("T-shirts")).toBe("clothes");
    expect(guessPackCategory("Linen shirt")).toBe("clothes");
    expect(guessPackCategory("Flip-flops")).toBe("clothes");
    expect(guessPackCategory("After-sun")).toBe("toiletries");
    expect(guessPackCategory("Suncream")).toBe("toiletries");
    expect(guessPackCategory("Plug adapter")).toBe("essentials");
    expect(guessPackCategory("EHIC card")).toBe("essentials");
    expect(guessPackCategory("Beach towel")).toBe("accessories");
    expect(guessPackCategory("Headphones")).toBe("accessories");
  });

  it("matches whole words, so a word inside another word files nothing", () => {
    expect(guessPackCategory("Hatstand")).toBe("other");
    expect(guessPackCategory("Scarface on DVD")).toBe("other");
  });

  it("files what it does not know under Other", () => {
    expect(guessPackCategory("Board game")).toBe("other");
    expect(guessPackCategory("   ")).toBe("other");
  });
});
