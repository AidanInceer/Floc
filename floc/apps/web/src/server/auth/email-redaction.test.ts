import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

const RESET_URL = "https://floc.test/reset-password?token=super-secret-token";

describe("console fallback", () => {
  it("keeps the reset token out of production logs", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await realEmail.sendEmails([
      realEmail.emails.resetPassword({ to: "ada@floc.test", url: RESET_URL }),
    ]);

    expect(logged.join("\n")).not.toContain("super-secret-token");
  });

  it("prints it in development, where the log is the only way to follow it", async () => {
    vi.stubEnv("NODE_ENV", "development");

    await realEmail.sendEmails([
      realEmail.emails.resetPassword({ to: "ada@floc.test", url: RESET_URL }),
    ]);

    expect(logged.join("\n")).toContain("super-secret-token");
  });

  it("still masks the recipient either way", async () => {
    vi.stubEnv("NODE_ENV", "development");

    await realEmail.sendEmails([
      realEmail.emails.resetPassword({ to: "ada@floc.test", url: RESET_URL }),
    ]);

    expect(logged.join("\n")).not.toContain("ada@floc.test");
    expect(logged.join("\n")).toContain("a…a@floc.test");
  });
});
