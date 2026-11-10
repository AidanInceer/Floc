import { describe, expect, it } from "vitest";

import { generateFriendTagSuffix, readFriendQuery } from "./friend-query";

describe("readFriendQuery", () => {
  it("refuses an email address — nobody is looked up by one", () => {
    expect(readFriendQuery("ann.lee@example.com")).toBeNull();
  });

  it("reads a full friend tag with a lowercase suffix", () => {
    expect(readFriendQuery(" Alex Morgan#k7m4 ")).toEqual({ kind: "code", code: "Alex Morgan#K7M4" });
  });

  it("refuses a tag without a name or with lookalike characters", () => {
    expect(readFriendQuery("#K7M4")).toBeNull();
    expect(readFriendQuery("Alex Morgan#I0L1")).toBeNull();
  });

  it("reads a hyphenated name without a digit as a name, not a code", () => {
    expect(readFriendQuery("Anne-Mary")).toEqual({ kind: "name", name: "Anne-Mary" });
  });

  it("reads anything else of two letters or more as a name", () => {
    expect(readFriendQuery("  sam ")).toEqual({ kind: "name", name: "sam" });
  });

  it("refuses a query too short to narrow anything", () => {
    expect(readFriendQuery(" a ")).toBeNull();
    expect(readFriendQuery("")).toBeNull();
  });
});

describe("generateFriendTagSuffix", () => {
  it("draws four characters from the unambiguous alphabet", () => {
    let n = 0;
    const bytes = (size: number) => Uint8Array.from({ length: size }, () => n++ % 256);
    for (let i = 0; i < 50; i++) {
      expect(generateFriendTagSuffix(bytes)).toMatch(/^[A-HJKMNP-Z2-9]{4}$/);
    }
  });

  it("discards bytes that would bias the alphabet and accepts all letters", () => {
    let call = 0;
    const bytes = (size: number) =>
      Uint8Array.from({ length: size }, () => (call === 0 ? 248 : 0));
    const code = generateFriendTagSuffix((size) => {
      const out = bytes(size);
      call++;
      return out;
    });
    expect(code).toBe("AAAA");
  });
});
