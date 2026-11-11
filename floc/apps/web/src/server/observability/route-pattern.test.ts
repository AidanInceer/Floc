import { describe, expect, it } from "vitest";

import { routePattern } from "./route-pattern";

describe("routePattern", () => {
  it("keeps a plain path as it is", () => {
    expect(routePattern("/explore")).toBe("/explore");
  });

  it("drops the query, which can hold a place name or a key", () => {
    expect(routePattern("/api/places?q=Lisbon&key=abc")).toBe("/api/places");
  });

  it("masks the id after trip, the user after profile and the file after files", () => {
    expect(routePattern("/trip/42/files/7")).toBe("/trip/[id]/files/[docId]");
    expect(routePattern("/profile/u_19x")).toBe("/profile/[userId]");
  });

  it("masks invite and calendar tokens", () => {
    expect(routePattern("/invite/abc")).toBe("/invite/[token]");
    expect(routePattern("/api/calendar/xyz.ics")).toBe("/api/calendar/[token]");
  });

  it("masks numbers, uuids and long tokens anywhere", () => {
    expect(routePattern("/api/thing/123/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d")).toBe("/api/thing/[n]/[id]");
    expect(routePattern("/reset/Zq3xVt9LmPw2RkY8sHn4Jc6B")).toBe("/reset/[token]");
  });

  it("caps a very long path", () => {
    expect(routePattern(`/${"a/".repeat(300)}`).length).toBeLessThanOrEqual(200);
  });

  it("gives / for a missing url", () => {
    expect(routePattern(undefined)).toBe("/");
  });
});
