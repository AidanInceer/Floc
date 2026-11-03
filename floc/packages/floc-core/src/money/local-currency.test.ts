import { describe, expect, it } from "vitest";

import { guessCurrency } from "./local-currency";

describe("guessCurrency", () => {
  it("takes the visitor's country first", () => {
    expect(guessCurrency({ country: "US", acceptLanguage: "en-GB" })).toBe("USD");
    expect(guessCurrency({ country: "de", acceptLanguage: null })).toBe("EUR");
  });

  it("falls back to the region in the browser's languages, in their order", () => {
    expect(guessCurrency({ country: null, acceptLanguage: "fr-CH,fr;q=0.9,en;q=0.8" })).toBe("CHF");
    expect(guessCurrency({ country: null, acceptLanguage: "en,en-AU;q=0.9" })).toBe("AUD");
  });

  it("ignores a country it has no currency for and keeps looking", () => {
    expect(guessCurrency({ country: "XX", acceptLanguage: "ja-JP" })).toBe("JPY");
    expect(guessCurrency({ country: "T1", acceptLanguage: "es-MX" })).toBe("MXN");
  });

  it("defaults to pounds when nothing names a place", () => {
    expect(guessCurrency({ country: null, acceptLanguage: "en" })).toBe("GBP");
    expect(guessCurrency({ country: null, acceptLanguage: null })).toBe("GBP");
    expect(guessCurrency({ country: "AR", acceptLanguage: "es-AR" })).toBe("GBP");
  });
});
