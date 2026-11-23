import { describe, expect, it } from "vitest";

import { STORE_PRODUCT_IDS, intervalOfProduct } from "./store-products";

describe("store products", () => {
  it("reads an interval back off its product id", () => {
    expect(intervalOfProduct(STORE_PRODUCT_IDS.yearly)).toBe("yearly");
    expect(intervalOfProduct(STORE_PRODUCT_IDS.monthly)).toBe("monthly");
  });

  it("sells the 3-month plan as its own store product (#523)", () => {
    expect(STORE_PRODUCT_IDS.quarterly).toBe("floc_pro_3_months");
    expect(intervalOfProduct("floc_pro_3_months")).toBe("quarterly");
  });

  it("knows nothing about a product it does not sell", () => {
    expect(intervalOfProduct("coins_100")).toBeNull();
  });
});
