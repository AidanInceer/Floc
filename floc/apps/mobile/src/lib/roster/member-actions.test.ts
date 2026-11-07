import { describe, expect, it } from "vitest";

import { memberActions } from "./member-actions";

describe("memberActions", () => {
  it("offers a member no admin power", () => {
    expect(memberActions({ viewerIsAdmin: false, you: false, role: "member" })).toEqual(["profile"]);
  });
  it("offers an admin promote and remove on a member", () => {
    expect(memberActions({ viewerIsAdmin: true, you: false, role: "member" })).toEqual(["profile", "promote", "remove"]);
  });
  it("does not offer promote on an admin", () => {
    expect(memberActions({ viewerIsAdmin: true, you: false, role: "admin" })).toEqual(["profile", "remove"]);
  });
  it("offers nothing on yourself", () => {
    expect(memberActions({ viewerIsAdmin: true, you: true, role: "admin" })).toEqual([]);
  });
});
