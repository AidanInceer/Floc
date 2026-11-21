import { describe, expect, it } from "vitest";

import { CURRENCIES, currencyName, currencyOptionLabel } from "./currency";

describe("currencyOptionLabel", () => {
  it("adds the symbol where it names one currency", () => {
    expect(currencyOptionLabel("EUR")).toBe("EUR (€)");
  });

  it("leaves the code alone where the symbol is shared", () => {
    expect(currencyOptionLabel("USD")).toBe("USD");
  });
});

describe("currency names (#707)", () => {
  it("names every currency in words", () => {
    expect(currencyName("GBP")).toBe("British pound");
    expect(currencyName("EUR")).toBe("Euro");
    for (const code of CURRENCIES) expect(currencyName(code)).not.toBe(code);
  });
});
