import { describe, expect, it, vi } from "vitest";

describe("sign-in rate limits", () => {
  // Why the long timeout: a cold import of Better Auth alone can pass 5 s on a busy machine.
  it("key each caller by the address Railway's edge sets in X-Real-IP", async () => {
    const { auth } = await vi.importActual<typeof import("./auth")>("./auth");
    expect(auth.options.advanced?.ipAddress?.ipAddressHeaders).toEqual(["x-real-ip"]);
  }, 30_000);
});
