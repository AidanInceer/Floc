import { describe, expect, it } from "vitest";

import { markLine } from "./agent-lines";

const card = { left: 500, top: 100, right: 700, bottom: 300, width: 200, height: 200 };

describe("markLine", () => {
  it("curves from the ask to the middle of a near card's left edge, leaving and landing level", () => {
    expect(markLine({ x: 400, y: 60 }, card)).toBe("M400 60 C450 60 450 200 500 200");
  });

  it("reaches a far card through the gap, then runs straight in, so it crosses no card", () => {
    expect(markLine({ x: 400, y: 60 }, card, 440)).toBe("M400 60 C420 60 420 200 440 200 L500 200");
  });
});
