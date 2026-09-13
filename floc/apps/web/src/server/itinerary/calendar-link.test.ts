import { describe, expect, it } from "vitest";

import { mintCalendarToken, readCalendarToken } from "./calendar-link";

describe("a member's calendar feed link", () => {
  it("names the trip and the member it was minted for", () => {
    expect(readCalendarToken(mintCalendarToken(7, "u-member"))).toEqual({
      tripId: 7,
      userId: "u-member",
    });
  });

  it("refuses a token whose trip was changed", () => {
    const [, signature] = mintCalendarToken(7, "u-member").split(".");
    const forged = `${Buffer.from("8:u-member").toString("base64url")}.${signature}`;
    expect(readCalendarToken(forged)).toBeNull();
  });

  it("refuses a made-up token", () => {
    expect(readCalendarToken("nonsense")).toBeNull();
    expect(readCalendarToken("")).toBeNull();
    expect(readCalendarToken(`${Buffer.from("x:y").toString("base64url")}.abc`)).toBeNull();
  });
});
