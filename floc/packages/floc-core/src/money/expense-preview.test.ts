import { describe, expect, it } from "vitest";

import { previewExpenseSplit } from "./expense-preview";

describe("expense preview", () => {
  it("allocates the remaining pennies in participant order after a fixed amount", () => {
    expect(previewExpenseSplit("10.01", [
      { userId: "a", shares: 1, pin: "2.00" },
      { userId: "b", shares: 1, pin: "" },
      { userId: "c", shares: 1, pin: "" },
    ], "GBP")).toEqual({
      amountMinor: 1001,
      amounts: { a: 200, b: 401, c: 400 },
      allocated: 1001,
      leftover: 0,
      evenEach: null,
    });
  });

  it.each([
    ["8.00", 100],
    ["12.00", -300],
  ])("shows the unallocated amount for an exact split of %s", (pin, leftover) => {
    const preview = previewExpenseSplit("10.00", [
      { userId: "a", shares: 1, pin },
      { userId: "b", shares: 1, pin: "1.00" },
    ], "GBP");
    expect(preview.leftover).toBe(leftover);
    expect(preview.evenEach).toBeNull();
  });

  it("keeps an empty or invalid draft readable", () => {
    expect(previewExpenseSplit("", [], "GBP")).toEqual({
      amountMinor: 0, amounts: {}, allocated: 0, leftover: 0, evenEach: null,
    });
    expect(previewExpenseSplit("no amount", [{ userId: "a", shares: 1, pin: "invalid" }], "GBP").amounts)
      .toEqual({ a: 0 });
  });

  it("shows the first share of an even split with a remainder penny", () => {
    expect(previewExpenseSplit("10.00", [
      { userId: "a", shares: 1, pin: "" },
      { userId: "b", shares: 1, pin: "" },
      { userId: "c", shares: 1, pin: "" },
    ], "GBP")).toEqual({
      amountMinor: 1000, amounts: { a: 334, b: 333, c: 333 },
      allocated: 1000, leftover: 0, evenEach: 334,
    });
  });

  it("supports whole-unit currencies and unequal shares", () => {
    expect(previewExpenseSplit("101", [
      { userId: "a", shares: 2, pin: "" },
      { userId: "b", shares: 1, pin: "" },
    ], "JPY")).toEqual({
      amountMinor: 101, amounts: { a: 67, b: 34 },
      allocated: 101, leftover: 0, evenEach: null,
    });
  });

  it("leaves the cost unallocated when nobody holds shares", () => {
    expect(previewExpenseSplit("10", [{ userId: "a", shares: 0, pin: "" }], "GBP"))
      .toMatchObject({ amounts: { a: 0 }, leftover: 1000, evenEach: null });
  });

  it("caps a pasted total and supports an amount still being typed", () => {
    expect(previewExpenseSplit("999999999999999", [], "GBP").amountMinor).toBe(100_000_000);
    expect(previewExpenseSplit("12.", [], "GBP").amountMinor).toBe(1200);
    expect(previewExpenseSplit("-1", [], "GBP").amountMinor).toBe(0);
  });
});
