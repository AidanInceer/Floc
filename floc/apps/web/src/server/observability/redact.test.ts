import { describe, expect, it } from "vitest";

import { redactFields, scrubText } from "./redact";

describe("scrubText", () => {
  it("replaces an email address", () => {
    expect(scrubText("no account for sam.lee+trips@example.co.uk here")).toBe("no account for [email] here");
  });

  it("replaces a long token", () => {
    expect(scrubText("reset link abcDEF0123456789abcdef0123_-xyz failed")).toBe("reset link [token] failed");
  });

  it("replaces a uuid", () => {
    expect(scrubText("trip 3f2504e0-4f89-11d3-9a0c-0305e82c3301 missing")).toBe("trip [id] missing");
  });

  it("keeps plain words and short numbers", () => {
    expect(scrubText("ceiling reached: days at 366")).toBe("ceiling reached: days at 366");
  });

  it("caps a long string", () => {
    expect(scrubText("a ".repeat(2000)).length).toBeLessThanOrEqual(1000);
  });
});

describe("redactFields", () => {
  it("drops keys that can hold personal data or secrets", () => {
    const kept = redactFields({
      email: "a@b.co",
      userName: "Sam",
      token: "t",
      sessionToken: "t",
      cookie: "c",
      authorization: "Bearer x",
      password: "p",
      clientSecret: "s",
      body: "{}",
      content: "x",
      noteText: "x",
      title: "Lisbon",
      phone: "07",
      address: "1 Road",
      query: "?q=1",
      route: "/trip/[id]",
      status: 500,
    });
    expect(kept).toEqual({ route: "/trip/[id]", status: 500 });
  });

  it("scrubs the string values it keeps", () => {
    expect(redactFields({ errorMessage: "no user a@b.co" })).toEqual({ errorMessage: "no user [email]" });
  });

  it("drops undefined values", () => {
    expect(redactFields({ route: undefined, ok: true })).toEqual({ ok: true });
  });
});
