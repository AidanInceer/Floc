import { describe, expect, it } from "vitest";

import { clearArea } from "./clear-area";

const band = { left: 100, top: 200, right: 1100, bottom: 760 };

describe("clearArea", () => {
  it("keeps the route left of a card that floats over the band", () => {
    const card = { left: 740, top: 220, right: 1080, bottom: 700 };
    expect(clearArea(band, card)).toEqual({ left: 24, top: 24, right: 616, bottom: 536 });
  });

  it("uses the whole band when the card sits below it, as on a phone", () => {
    const card = { left: 100, top: 760, right: 1100, bottom: 1200 };
    expect(clearArea(band, card)).toEqual({ left: 24, top: 24, right: 976, bottom: 536 });
  });

  it("uses the whole band with no card", () => {
    expect(clearArea(band, null).right).toBe(976);
  });
});
