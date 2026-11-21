import { describe, expect, it } from "vitest";

import { INVITE_LINK_DAYS, INVITE_LINK_LIFE, INVITE_LINK_RESET } from "./invite-link";

describe("an invite link's life", () => {
  it("lasts a week and says so", () => {
    expect(INVITE_LINK_DAYS).toBe(7);
    expect(INVITE_LINK_LIFE).toBe("The link works for 7 days.");
  });

  it("says a reset removes what guests answered and keeps the members", () => {
    expect(INVITE_LINK_RESET).toBe(
      "The old link stops working for anyone still holding it. Answers from guests are removed. Everyone already on the trip stays.",
    );
  });
});
