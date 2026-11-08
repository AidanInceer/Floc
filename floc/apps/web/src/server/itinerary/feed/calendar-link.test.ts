import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { mintCalendarToken, readCalendarToken } from "./calendar-link";

describe("a member's calendar feed link", () => {
  it("names the trip, the member and the link's number", () => {
    expect(readCalendarToken(mintCalendarToken(7, "u-member", 3))).toEqual({
      tripId: 7,
      userId: "u-member",
      epoch: 3,
    });
  });

  it("refuses a token whose trip or number was changed", () => {
    const [, signature] = mintCalendarToken(7, "u-member", 0).split(".");
    for (const payload of ["8:0:u-member", "7:1:u-member"]) {
      expect(readCalendarToken(`${Buffer.from(payload).toString("base64url")}.${signature}`)).toBeNull();
    }
  });

  it("reads a link minted before links could be reset as number 0, so it works until the first reset", () => {
    const payload = Buffer.from("7:u-member").toString("base64url");
    const signature = createHmac("sha256", "dev-only-secret-change-me").update(`calendar:${payload}`).digest("base64url");
    expect(readCalendarToken(`${payload}.${signature}`)).toEqual({ tripId: 7, userId: "u-member", epoch: 0 });
  });

  it("refuses a made-up token", () => {
    expect(readCalendarToken("nonsense")).toBeNull();
    expect(readCalendarToken("")).toBeNull();
    expect(readCalendarToken(`${Buffer.from("x:y").toString("base64url")}.abc`)).toBeNull();
  });
});
