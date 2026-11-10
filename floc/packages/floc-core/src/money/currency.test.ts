import { describe, expect, it } from "vitest";

import { currencyOptionLabel } from "./currency";

describe("currencyOptionLabel", () => {
  it("adds the symbol where it names one currency", () => {
    expect(currencyOptionLabel("EUR")).toBe("EUR (€)");
  });

  it("leaves the code alone where the symbol is shared", () => {
    expect(currencyOptionLabel("USD")).toBe("USD");
  });
});
