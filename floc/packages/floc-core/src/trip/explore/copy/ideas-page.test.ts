import { describe, expect, it } from "vitest";

import { pageText, parsePageBody, serialisePage, type TableBlock } from "../../../notes/pages/page-blocks";
import { at, swap } from "../detail/ideas";
import { ideasPage } from "./ideas-page";

const ideas = {
  atStops: [at("Seville", [["Flamenco in Triana", "Relaxed", "Mid"], ["Kayak the river", "Active", "Free"]])],
  otherStops: [swap("Granada", 2, "Córdoba", "The Alhambra and the Albaicín.")],
};

describe("ideasPage", () => {
  it("lists ideas by stop, then other stops", () => {
    expect(pageText(ideasPage(ideas)).split("\n")).toEqual([
      "At your stops",
      "Seville",
      "Idea\tPace\tCost",
      "Flamenco in Triana\tRelaxed\tMid",
      "Kayak the river\tActive\tFree",
      "Other stops",
      "Place\tNights\tInstead of\tWhat to do there",
      "Granada\t2\tCórdoba\tThe Alhambra and the Albaicín.",
    ]);
  });

  it("tints pace and cost, with the word still in the cell", () => {
    const table = ideasPage(ideas)[2] as TableBlock;
    expect(table.rows[2].map((c) => c.tone)).toEqual([null, "blush", "mint"]);
  });

  it("survives a round trip through a stored body", () => {
    const blocks = ideasPage(ideas);
    expect(parsePageBody(serialisePage(blocks))).toEqual(blocks);
  });
});
