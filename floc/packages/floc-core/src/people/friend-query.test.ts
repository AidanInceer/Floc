import { describe, expect, it } from "vitest";

import { generateFriendCode, readFriendQuery } from "./friend-query";

describe("readFriendQuery", () => {
  it("refuses an email address — nobody is looked up by one", () => {
    expect(readFriendQuery("ann.lee@example.com")).toBeNull();
  });

  it("reads a friend code in any case, with or without spaces", () => {
    expect(readFriendQuery(" k7rm-2pqx ")).toEqual({ kind: "code", code: "K7RM-2PQX" });
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

describe("generateFriendCode", () => {
  it("draws four and four from the unambiguous alphabet, always with a digit", () => {
    let n = 0;
    const bytes = (size: number) => Uint8Array.from({ length: size }, () => n++ % 256);
    for (let i = 0; i < 50; i++) {
      const code = generateFriendCode(bytes);
      expect(code).toMatch(/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/);
      expect(code).toMatch(/[2-9]/);
      expect(readFriendQuery(code)).toEqual({ kind: "code", code });
    }
  });

  it("draws again when the bytes give a code with no digit", () => {
    let call = 0;
    const bytes = (size: number) =>
      Uint8Array.from({ length: size }, () => (call === 0 ? 0 : 30));
    const code = generateFriendCode((size) => {
      const out = bytes(size);
      call++;
      return out;
    });
    expect(code).toBe("9999-9999");
  });
});
