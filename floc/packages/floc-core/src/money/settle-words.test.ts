import { describe, expect, it } from "vitest";

import type { SettleRow } from "./group-settle";
import { settleSides } from "./settle-words";

const row = (payer: string, payee: string): SettleRow => ({ payer, payee, currency: "GBP", amountMinor: 1000, netted: false, parts: [] });

describe("settleSides", () => {
  it("puts what you pay, what you are owed and what is between others in their own lists", () => {
    const pay = row("me", "sam");
    const owed = row("kit", "me");
    const other = row("kit", "sam");
    expect(settleSides([pay, owed, other], "me")).toEqual({ owe: [pay], owed: [owed], others: [other] });
  });

  it("treats every row as between others when nobody is signed in", () => {
    const other = row("kit", "sam");
    expect(settleSides([other], undefined)).toEqual({ owe: [], owed: [], others: [other] });
  });
});
