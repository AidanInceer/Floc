import { afterEach, describe, expect, it, vi } from "vitest";

import { isCronCaller } from "@/server/notifications/cron-caller";

afterEach(() => vi.unstubAllEnvs());

describe("isCronCaller", () => {
  it("lets in the right secret only", () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(isCronCaller("Bearer s3cret")).toBe(true);
    expect(isCronCaller("Bearer wrong!")).toBe(false);
    expect(isCronCaller(null)).toBe(false);
  });

  it("lets nobody in when no secret is set", () => {
    vi.stubEnv("CRON_SECRET", "");
    expect(isCronCaller("Bearer ")).toBe(false);
  });
});
