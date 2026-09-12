import { describe, expect, it } from "vitest";

import { mintViewToken, viewTokenHolds } from "./view-link";

describe("a file's view link", () => {
  it("opens the document it was minted for", () => {
    expect(viewTokenHolds(mintViewToken(7), 7)).toBe(true);
  });

  it("does not open another document", () => {
    expect(viewTokenHolds(mintViewToken(7), 8)).toBe(false);
  });

  it("stops working once it has run out", () => {
    const token = mintViewToken(7, 0);
    expect(viewTokenHolds(token, 7, 0)).toBe(true);
    expect(viewTokenHolds(token, 7, 10 * 60 * 1000)).toBe(false);
  });

  it("refuses a made-up signature", () => {
    expect(viewTokenHolds(`${Date.now() + 60_000}.nonsense`, 7)).toBe(false);
    expect(viewTokenHolds("nonsense", 7)).toBe(false);
    expect(viewTokenHolds("", 7)).toBe(false);
  });
});
