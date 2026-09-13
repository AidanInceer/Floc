import { describe, expect, it } from "vitest";

import { localPath } from "./local-path";

describe("localPath", () => {
  it("keeps a site-relative path", () => {
    expect(localPath("/trip/4/overview?tab=days", "/trips")).toBe("/trip/4/overview?tab=days");
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "javascript:alert(1)",
    "trips",
    "",
  ])("falls back for %j", (raw) => {
    expect(localPath(raw, "/trips")).toBe("/trips");
  });

  it("falls back when nothing arrived", () => {
    expect(localPath(null, "/trips")).toBe("/trips");
  });
});
