import { afterEach, describe, expect, it, vi } from "vitest";

import { appUrl, requireInProduction } from "./env";

const NAME = "WAYPOINT_TEST_ONLY_VAR";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("requireInProduction", () => {
  it("returns the value when it is set", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv(NAME, "real-value");
    expect(requireInProduction(NAME, "fallback")).toBe("real-value");
  });

  it("falls back outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv(NAME, "");
    expect(requireInProduction(NAME, "fallback")).toBe("fallback");
  });

  it("throws in production when unset", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv(NAME, undefined);
    expect(() => requireInProduction(NAME, "fallback")).toThrow(NAME);
  });

  it("throws in production when set to the empty string", () => {
    // A misspelled name in a deployment UI often lands as "" rather than unset.
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv(NAME, "");
    expect(() => requireInProduction(NAME, "fallback")).toThrow(NAME);
  });

  it("allows the dev fallback during Next production build", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    vi.stubEnv(NAME, "");
    expect(requireInProduction(NAME, "fallback")).toBe("fallback");
  });

  it("never puts the fallback in the error message", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv(NAME, "");
    expect(() => requireInProduction(NAME, "dev-only-secret")).not.toThrow(
      /dev-only-secret/,
    );
  });
});

describe("appUrl", () => {
  it("is localhost outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("BETTER_AUTH_URL", "");
    expect(appUrl()).toBe("http://localhost:3000");
  });

  it("refuses to fall back to localhost in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BETTER_AUTH_URL", "");
    expect(() => appUrl()).toThrow("BETTER_AUTH_URL");
  });
});
