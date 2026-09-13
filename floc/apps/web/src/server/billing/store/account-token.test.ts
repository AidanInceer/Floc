import { describe, expect, it } from "vitest";

import { accountTokenFor } from "@/server/billing/store/account-token";

describe("the account token a purchase carries", () => {
  it("is a UUID, because Apple refuses anything else", () => {
    expect(accountTokenFor("u-admin")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("is the same every time for one account", () => {
    expect(accountTokenFor("u-admin")).toBe(accountTokenFor("u-admin"));
  });

  it("differs between accounts", () => {
    expect(accountTokenFor("u-admin")).not.toBe(accountTokenFor("u-member"));
  });
});
