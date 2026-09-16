import { describe, expect, it } from "vitest";

import { titleCase } from "./title-case";

describe("titleCase", () => {
  it("capitalises main words and keeps small words low", () => {
    expect(titleCase("Surf and wine, Portugal")).toBe("Surf and Wine, Portugal");
  });

  it("capitalises a small word when it starts the title", () => {
    expect(titleCase("the Dolomites, february")).toBe("The Dolomites, February");
  });

  it("keeps capitals someone typed", () => {
    expect(titleCase("NYC for a week")).toBe("NYC for a Week");
  });

  it("capitalises each part of a hyphenated word", () => {
    expect(titleCase("cortina d'ampezzo road-trip")).toBe("Cortina d'Ampezzo Road-Trip");
  });

  it("leaves numbers alone", () => {
    expect(titleCase("1234")).toBe("1234");
  });
});
