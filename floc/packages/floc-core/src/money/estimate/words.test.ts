import { describe, expect, it } from "vitest";

import { fitWords, progressWords, wholeMoney, wholeRange } from "./words";

describe("wholeMoney", () => {
  it("drops the pence and keeps the symbol", () => {
    expect(wholeMoney(82500, "GBP")).toBe("£825");
    expect(wholeMoney(135000, "EUR")).toBe("€1,350");
  });

  it("uses the code where the symbol is ambiguous", () => {
    expect(wholeMoney(12000, "USD")).toBe("USD 120");
  });
});

describe("wholeRange", () => {
  it("joins two figures with an en dash, or shows one", () => {
    expect(wholeRange([82500, 135000], "GBP")).toBe("£825–£1,350");
    expect(wholeRange([40000, 40000], "GBP")).toBe("£400");
  });
});

describe("fitWords", () => {
  it("says the fit in a word, and how far off", () => {
    expect(fitWords({ kind: "fits" }, "GBP")).toBe("Fits");
    expect(fitWords({ kind: "tight", short: 25000 }, "GBP")).toBe("Tight · up to £250 short");
    expect(fitWords({ kind: "over", by: 12500 }, "GBP")).toBe("Over by £125");
  });
});

describe("progressWords", () => {
  it("says where a line stands", () => {
    expect(progressWords({ kind: "no-guide" }, "GBP")).toBe("No guide");
    expect(progressWords({ kind: "not-started" }, "GBP")).toBe("Not started");
    expect(progressWords({ kind: "in-range" }, "GBP")).toBe("In range");
    expect(progressWords({ kind: "to-go", range: [21700, 39200] }, "GBP")).toBe("£217–£392 to go");
    expect(progressWords({ kind: "over", by: 2000 }, "GBP")).toBe("Over by £20");
  });
});
