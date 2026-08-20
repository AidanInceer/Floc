/**
 * A reset link is a bearer credential (#149): whoever holds it can take the
 * account. With no mail provider the send falls back to the console, so the
 * fallback must not be the leak.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The shared setup stubs `sendEmails`; this suite needs the real one.
const realEmail = await vi.importActual<typeof import("./email")>("./email");

let logged: string[] = [];

beforeEach(() => {
  logged = [];
  vi.spyOn(console, "info").mockImplementation((msg: unknown) => {
    logged.push(String(msg));
  });
  vi.stubEnv("RESEND_API_KEY", "");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

const RESET_URL = "https://waypoint.test/reset-password?token=super-secret-token";

describe("console fallback", () => {
  it("keeps the reset token out of production logs", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await realEmail.sendEmails([
      realEmail.emails.resetPassword({ to: "ada@waypoint.test", url: RESET_URL }),
    ]);

    expect(logged.join("\n")).not.toContain("super-secret-token");
  });

  it("prints it in development, where the log is the only way to follow it", async () => {
    vi.stubEnv("NODE_ENV", "development");

    await realEmail.sendEmails([
      realEmail.emails.resetPassword({ to: "ada@waypoint.test", url: RESET_URL }),
    ]);

    expect(logged.join("\n")).toContain("super-secret-token");
  });

  it("still masks the recipient either way", async () => {
    vi.stubEnv("NODE_ENV", "development");

    await realEmail.sendEmails([
      realEmail.emails.resetPassword({ to: "ada@waypoint.test", url: RESET_URL }),
    ]);

    expect(logged.join("\n")).not.toContain("ada@waypoint.test");
    expect(logged.join("\n")).toContain("a…a@waypoint.test");
  });
});
