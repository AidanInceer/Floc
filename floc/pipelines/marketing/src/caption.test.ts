import { describe, expect, it } from "vitest";
import { checkCaption } from "./caption.ts";

describe("checkCaption", () => {
  it("passes a plain British caption", () => {
    expect(checkCaption("Plan the trip together. Pro from £3.99 a month. #grouptravel")).toEqual([]);
  });

  it("refuses an empty caption", () => {
    expect(checkCaption("  \n")).toEqual(["Caption is empty."]);
  });

  it("refuses more than 2,200 characters", () => {
    expect(checkCaption("a".repeat(2201))).toEqual(["Caption is 2201 characters; Instagram allows 2,200."]);
  });

  it("refuses more than 30 hashtags", () => {
    const tags = Array.from({ length: 31 }, (_, i) => `#t${i}`).join(" ");
    expect(checkCaption(tags)).toEqual(["Caption has 31 hashtags; Instagram allows 30."]);
  });

  it("refuses emoji", () => {
    expect(checkCaption("Sorted ✈️")).toEqual(["Caption has emoji; Floc uses none."]);
  });

  it("names American spellings with the British form", () => {
    expect(checkCaption("Organize your favorite trips")).toEqual([
      "“Organize” is American; write “organise”.",
      "“favorite” is American; write “favourite”.",
    ]);
  });

  it("does not flag a British word that contains an American one", () => {
    expect(checkCaption("Colourful days, centred on you")).toEqual([]);
  });

  it("refuses a price Floc does not charge", () => {
    expect(checkCaption("Pro is £4.99 a month")).toEqual([
      "“£4.99” is not a price Floc charges (£0, £3.99, £29.99). If Stripe changed, update facts.ts.",
    ]);
  });
});
