import { describe, expect, it } from "vitest";

import { INVITE_LINK_DAYS, INVITE_LINK_LIFE } from "./invite-link";

describe("an invite link's life", () => {
  it("lasts a week and says so", () => {
    expect(INVITE_LINK_DAYS).toBe(7);
    expect(INVITE_LINK_LIFE).toBe("The link works for 7 days.");
  });
});
