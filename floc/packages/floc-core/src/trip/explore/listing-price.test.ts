import { describe, expect, it } from "vitest";

import { listingPrice, poundsIn } from "./listing-price";

const rates = { home: "USD", toHome: { USD: 1, GBP: 1.25, EUR: 1.1 } } as const;

describe("listingPrice", () => {
  it("shows a listing in the viewer's currency, rounded up to a whole unit", () => {
    expect(listingPrice({ priceFromMinor: 120000, currency: "GBP" }, rates)).toBe("USD 1,500.00");
    expect(listingPrice({ priceFromMinor: 99999, currency: "EUR" }, rates)).toBe("USD 1,100.00");
  });

  it("leaves a listing already in the viewer's currency as it is", () => {
    expect(listingPrice({ priceFromMinor: 123456, currency: "USD" }, rates)).toBe("USD 1,234.56");
  });

  it("keeps the listing's own currency when no rate is known (rule 11)", () => {
    expect(listingPrice({ priceFromMinor: 120000, currency: "GBP" }, null)).toBe("£1,200.00");
    expect(listingPrice({ priceFromMinor: 50000, currency: "ZAR" }, rates)).toBe("R500.00");
  });

  it("rounds a zero-decimal currency to a whole yen", () => {
    expect(listingPrice({ priceFromMinor: 10001, currency: "GBP" }, { home: "JPY", toHome: { GBP: 190.5 } })).toBe("JPY 19,052");
  });
});

describe("poundsIn", () => {
  it("says a finder figure, counted in pounds, in the viewer's currency", () => {
    expect(poundsIn(5000, rates)).toBe("USD 6,250");
    expect(poundsIn(0, rates)).toBe("USD 0");
  });

  it("stays in pounds without a rate", () => {
    expect(poundsIn(1200, null)).toBe("£1,200");
    expect(poundsIn(1200, { home: "USD", toHome: {} })).toBe("£1,200");
  });
});
