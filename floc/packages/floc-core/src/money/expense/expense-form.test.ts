import { describe, expect, it } from "vitest";

import { splitBox, splitFromForm, SPLIT_MODES } from "./expense-form";
import { NO_AMOUNT, NO_SHARES } from "../expense-rules";

const row = (shares: number, pin = "") => ({ shares, pin });

describe("splitBox", () => {
  it("gives everyone one share and no amount when split equally", () => {
    expect(splitBox("equally", "a", row(3, "9.00"))).toEqual({ userId: "a", shares: 1, pin: "" });
  });

  it("keeps the typed shares and drops any amount in Shares", () => {
    expect(splitBox("shares", "a", row(3, "9.00"))).toEqual({ userId: "a", shares: 3, pin: "" });
  });

  it("keeps the typed amount in Exact, with one share to take any rest", () => {
    expect(splitBox("exact", "a", row(3, "9.00"))).toEqual({ userId: "a", shares: 1, pin: "9.00" });
  });

  it("names the three ways the same on web and phone", () => {
    expect(SPLIT_MODES.map((m) => m.label)).toEqual(["Equally", "Exact", "Shares"]);
  });
});

describe("splitFromForm", () => {
  const box = (userId: string, shares = 1, pin = "") => ({ userId, shares, pin });

  it("splits a bill equally, with a row only for the people in on it", () => {
    expect(splitFromForm("10.00", [box("a"), box("b"), box("c")], "GBP")).toEqual({
      ok: true,
      amountMinor: 1000,
      splitType: "shares",
      splits: [
        { userId: "a", owedAmountMinor: 334 },
        { userId: "b", owedAmountMinor: 333 },
        { userId: "c", owedAmountMinor: 333 },
      ],
    });
  });

  it("lets an empty Exact box take what the typed amounts leave", () => {
    const result = splitFromForm("30.00", [box("a", 1, "20.00"), box("b"), box("c")], "GBP");
    expect(result).toMatchObject({ ok: true, splitType: "exact" });
    expect(result.ok && result.splits).toEqual([
      { userId: "a", owedAmountMinor: 2000 },
      { userId: "b", owedAmountMinor: 500 },
      { userId: "c", owedAmountMinor: 500 },
    ]);
  });

  it("says so when every Exact box is filled and they fall short", () => {
    const result = splitFromForm("30.00", [box("a", 1, "10.00"), box("b", 1, "10.00")], "GBP");
    expect(result).toEqual({ ok: false, problem: "£10.00 is left over and nobody's on shares to absorb it." });
  });

  it("says so when the typed amounts come to more than the bill", () => {
    const result = splitFromForm("10.00", [box("a", 1, "20.00")], "GBP");
    expect(result.ok).toBe(false);
  });

  it("asks for an amount above zero, in the same words everywhere", () => {
    expect(splitFromForm("0", [box("a")], "GBP")).toEqual({ ok: false, problem: NO_AMOUNT });
    expect(splitFromForm("lots", [box("a")], "GBP")).toEqual({ ok: false, problem: NO_AMOUNT });
  });

  it("needs somebody in on it", () => {
    expect(splitFromForm("10.00", [], "GBP")).toEqual({ ok: false, problem: NO_SHARES });
  });

  it("says somebody has to owe something when every share is nought", () => {
    expect(splitFromForm("10.00", [box("a", 0), box("b", 0)], "GBP")).toEqual({ ok: false, problem: NO_SHARES });
  });

  it("refuses shares that are not a number", () => {
    expect(splitFromForm("10.00", [box("a", Number.NaN)], "GBP").ok).toBe(false);
  });
});
