import { describe, expect, it } from "vitest";

import { INVITE_LINK_DAYS } from "@floc/core/trip/group/invite-link";

import { BARE_LINKS_END, mintShareToken, readShareToken } from "./invite-link";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2027, 0, 10);

describe("a trip's share link", () => {
  it("names the trip's invite token it was made for", () => {
    expect(readShareToken(mintShareToken("token-ours", NOW), NOW)).toBe("token-ours");
  });

  it("works up to its last day and not after", () => {
    const link = mintShareToken("token-ours", NOW);
    expect(readShareToken(link, NOW + INVITE_LINK_DAYS * DAY - 1)).toBe("token-ours");
    expect(readShareToken(link, NOW + INVITE_LINK_DAYS * DAY + 1)).toBeNull();
  });

  it("cannot be given a later end date by hand", () => {
    const [token, , signature] = mintShareToken("token-ours", NOW).split(".");
    const later = (NOW + 365 * DAY).toString(36);
    expect(readShareToken(`${token}.${later}.${signature}`, NOW)).toBeNull();
  });

  it("cannot be pointed at another trip", () => {
    const [, end, signature] = mintShareToken("token-ours", NOW).split(".");
    expect(readShareToken(`token-theirs.${end}.${signature}`, NOW)).toBeNull();
  });

  it("refuses a made-up link", () => {
    expect(readShareToken("", NOW)).toBeNull();
    expect(readShareToken("a.b.c", NOW)).toBeNull();
    expect(readShareToken("token-ours.zzzz.", NOW)).toBeNull();
    expect(readShareToken("a.b.c.d", NOW)).toBeNull();
  });
});

describe("a link sent before links had an end date", () => {
  it("still works until the changeover ends", () => {
    expect(readShareToken("token-ours", BARE_LINKS_END - 1)).toBe("token-ours");
  });

  it("stops working after it", () => {
    expect(readShareToken("token-ours", BARE_LINKS_END + 1)).toBeNull();
  });
});
