import { describe, expect, it } from "vitest";

import { STORE_PRODUCT_IDS, intervalOfProduct } from "./store-products";

describe("store products", () => {
  it("names one product per interval", () => {
    expect(Object.keys(STORE_PRODUCT_IDS).sort()).toEqual(["monthly", "yearly"]);
  });

  it("reads an interval back off its product id", () => {
    expect(intervalOfProduct(STORE_PRODUCT_IDS.yearly)).toBe("yearly");
    expect(intervalOfProduct(STORE_PRODUCT_IDS.monthly)).toBe("monthly");
  });

  it("knows nothing about a product it does not sell", () => {
    expect(intervalOfProduct("coins_100")).toBeNull();
  });
});
