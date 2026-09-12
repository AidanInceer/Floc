import { describe, expect, it } from "vitest";

import { endsWithoutRenewing } from "./cancellation";

describe("endsWithoutRenewing", () => {
  it("is false for a subscription that renews", () => {
    expect(
      endsWithoutRenewing({ cancel_at_period_end: false, cancel_at: null }),
    ).toBe(false);
  });

  it("is true when cancelled at period end", () => {
    expect(
      endsWithoutRenewing({ cancel_at_period_end: true, cancel_at: null }),
    ).toBe(true);
  });

  it("is true when the portal sets a cancel date instead", () => {
    expect(
      endsWithoutRenewing({ cancel_at_period_end: false, cancel_at: 1791840481 }),
    ).toBe(true);
  });
});
