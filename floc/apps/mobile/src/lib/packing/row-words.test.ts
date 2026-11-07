import { describe, expect, it } from "vitest";

import { groupCount, needsRemoveConfirm, sectionCount, sharedSaid, splitFigures } from "./row-words";

describe("groupCount", () => {
  it("shows packed over total", () => {
    expect(groupCount([true, false, false])).toEqual({ text: "1/3", full: false });
  });

  it("says all packed when every line is", () => {
    expect(groupCount([true, true])).toEqual({ text: "All packed", full: true });
  });

  it("says how many are left to claim when a line cannot be packed", () => {
    expect(groupCount([null, null])).toEqual({ text: "2 to claim", full: false });
    expect(groupCount([null])).toEqual({ text: "1 to claim", full: false });
  });

  it("is empty for no lines", () => {
    expect(groupCount([])).toEqual({ text: "", full: false });
  });
});

describe("sectionCount", () => {
  it("counts things when none are packed", () => {
    expect(sectionCount(1, 0)).toBe("1 thing");
    expect(sectionCount(4, 0)).toBe("4 things");
  });

  it("counts packed of total", () => {
    expect(sectionCount(5, 2)).toBe("2 of 5 packed");
  });
});

describe("sharedSaid", () => {
  it("says nothing for a line nobody has", () => {
    expect(sharedSaid({ others: [] })).toBe("");
  });

  it("names the others bringing it too", () => {
    expect(sharedSaid({ others: ["Sofia", "Raj"] })).toBe("with Sofia, Raj");
  });

  it("never repeats packed", () => {
    expect(sharedSaid({ others: ["Raj"] })).toBe("with Raj");
  });
});

describe("needsRemoveConfirm", () => {
  it("is false when only you hold the line", () => {
    expect(needsRemoveConfirm([{ userId: "me" }], "me")).toBe(false);
    expect(needsRemoveConfirm([], "me")).toBe(false);
  });

  it("is true when someone else holds it", () => {
    expect(needsRemoveConfirm([{ userId: "me" }, { userId: "dev" }], "me")).toBe(true);
  });
});

describe("splitFigures", () => {
  it("marks figures and keeps words apart", () => {
    expect(splitFigures("1 to claim")).toEqual([
      { text: "1", figure: true },
      { text: " to claim", figure: false },
    ]);
    expect(splitFigures("2 of 5 packed").filter((p) => p.figure).map((p) => p.text)).toEqual(["2", "5"]);
    expect(splitFigures("0/1")).toEqual([{ text: "0/1", figure: true }]);
    expect(splitFigures("All packed")).toEqual([{ text: "All packed", figure: false }]);
  });
});
