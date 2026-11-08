import { describe, expect, it } from "vitest";

import { figureParts } from "./figure-parts";

describe("figureParts", () => {
  it("returns plain text as one part", () => {
    expect(figureParts("Carry cash.")).toEqual([{ text: "Carry cash.", figure: false }]);
  });

  it("sets only the number of a mark as a figure", () => {
    expect(figureParts("Valid **30 days** here")).toEqual([
      { text: "Valid ", figure: false },
      { text: "30", figure: true },
      { text: " days", figure: false },
      { text: " here", figure: false },
    ]);
  });

  it("keeps currency and time tokens whole", () => {
    expect(figureParts("**N$1,600** at **09:00**").filter((p) => p.figure).map((p) => p.text)).toEqual(["N$1,600", "09:00"]);
  });

  it("keeps a euro, pound or yen sign with its number", () => {
    expect(figureParts("**€40** or **£35** or **¥1,200**").filter((p) => p.figure).map((p) => p.text)).toEqual(["€40", "£35", "¥1,200"]);
  });

  it("leaves a mark with no number as plain text", () => {
    expect(figureParts("Go **early**")).toEqual([
      { text: "Go ", figure: false },
      { text: "early", figure: false },
    ]);
  });

  it("gives no parts for empty text", () => {
    expect(figureParts("")).toEqual([]);
  });
});
