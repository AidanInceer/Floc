import { describe, expect, it } from "vitest";
import { paperStyle } from "./map";

describe("paperStyle", () => {
  it("is a background of the given colour and no tiles", () => {
    const style = paperStyle("#fafaf7");
    expect(style.sources).toEqual({});
    expect(style.layers).toEqual([
      { id: "paper", type: "background", paint: { "background-color": "#fafaf7" } },
    ]);
  });
});
