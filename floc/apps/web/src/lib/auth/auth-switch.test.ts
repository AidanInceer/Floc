import { describe, expect, it } from "vitest";

import { authSwitchHref } from "./auth-switch";

describe("authSwitchHref", () => {
  it("carries where you were headed across to the other form", () => {
    expect(authSwitchHref("/login", "/explore/japan-golden-route?start=1")).toBe(
      "/login?redirect=%2Fexplore%2Fjapan-golden-route%3Fstart%3D1",
    );
  });

  it("is the bare page when you were headed nowhere", () => {
    expect(authSwitchHref("/signup", undefined)).toBe("/signup");
  });

  it("drops a target on another site", () => {
    expect(authSwitchHref("/signup", "//evil.example/x")).toBe("/signup");
  });
});
