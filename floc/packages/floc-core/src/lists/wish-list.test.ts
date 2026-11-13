import { describe, expect, it } from "vitest";

import { linkShown, readWishItem, readWishLink, readWishListName, wishListTitle } from "./wish-list";

describe("readWishLink", () => {
  it("keeps an https address and names its host", () => {
    expect(readWishLink(" https://www.gadventures.com/trips/peru ")).toEqual({
      url: "https://www.gadventures.com/trips/peru",
      host: "gadventures.com",
    });
  });

  it("takes a bare address as https", () => {
    expect(readWishLink("example.com/a")).toEqual({ url: "https://example.com/a", host: "example.com" });
  });

  it.each(["javascript:alert(1)", "data:text/html,hi", "ftp://x.com", "file:///etc/passwd", "", "not a link", "https://"])(
    "refuses %s",
    (raw) => {
      expect(readWishLink(raw)).toBeNull();
    },
  );

  it("refuses an address with a password in it", () => {
    expect(readWishLink("https://me:secret@example.com")).toBeNull();
  });

  it("refuses an address past the cap", () => {
    expect(readWishLink(`https://example.com/${"a".repeat(2100)}`)).toBeNull();
  });
});

describe("linkShown", () => {
  it("shows the label when there is one", () => {
    expect(linkShown("Peru trek", "https://example.com/x")).toBe("Peru trek");
  });

  it("shows the host otherwise", () => {
    expect(linkShown(null, "https://www.example.com/x")).toBe("example.com");
  });
});

describe("wishListTitle", () => {
  it("uses the name it was given", () => {
    expect(wishListTitle("Uni lot", ["Jonathan"])).toBe("Uni lot");
  });

  it("names one other person", () => {
    expect(wishListTitle(null, ["Jonathan Hale"])).toBe("Wish list with Jonathan");
  });

  it("names two and counts the rest", () => {
    expect(wishListTitle(null, ["Jonathan Hale", "Sam Price", "Mei Lin", "Nadia Okafor"])).toBe("Wish list with Jonathan, Sam +2");
  });

  it("names nobody when you are alone on it", () => {
    expect(wishListTitle(null, [])).toBe("Wish list");
  });
});

describe("readWishListName", () => {
  it("trims, caps, and reads empty as no name", () => {
    expect(readWishListName("  ")).toBeNull();
    expect(readWishListName(" Uni lot ")).toBe("Uni lot");
    expect(readWishListName("x".repeat(100))).toHaveLength(60);
  });
});

describe("readWishItem", () => {
  it("reads text", () => {
    expect(readWishItem({ kind: "text", text: " Somewhere with a lake, May " })).toEqual({ kind: "text", text: "Somewhere with a lake, May" });
  });

  it("reads a link with its label", () => {
    expect(readWishItem({ kind: "link", url: "https://example.com", label: " Trek " })).toEqual({
      kind: "link",
      url: "https://example.com/",
      label: "Trek",
    });
  });

  it("reads a country by its code", () => {
    expect(readWishItem({ kind: "country", code: "pt" })).toEqual({ kind: "country", code: "PT" });
  });

  it("reads an Explore listing by id", () => {
    expect(readWishItem({ kind: "explore", presetId: "japan-classic" })).toEqual({ kind: "explore", presetId: "japan-classic" });
  });

  it.each([
    { kind: "text", text: "  " },
    { kind: "link", url: "javascript:x" },
    { kind: "country", code: "ZZ" },
    { kind: "explore", presetId: "" },
    { kind: "nope" },
    null,
    "text",
  ])("refuses %j", (raw) => {
    expect(readWishItem(raw)).toBeNull();
  });
});
