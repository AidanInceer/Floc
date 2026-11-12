import { describe, expect, it, vi } from "vitest";

// Why stand-ins: these tests read the options auth.ts hands Better Auth. A cold import of Better Auth itself
// passed 30 s on a busy machine, and the options are the same without it.
vi.mock("better-auth", () => ({ betterAuth: (options: unknown) => ({ options }) }));
vi.mock("better-auth/adapters/drizzle", () => ({ drizzleAdapter: () => ({}) }));
vi.mock("better-auth/next-js", () => ({ nextCookies: () => ({}) }));
vi.mock("better-auth/plugins", () => ({ anonymous: () => ({}), bearer: () => ({}) }));
vi.mock("@better-auth/expo", () => ({ expo: () => ({}) }));

const loadAuth = async () => (await vi.importActual<typeof import("./auth")>("./auth")).auth;

describe("sign-in rate limits", () => {
  it("key each caller by the address Railway's edge sets in X-Real-IP", async () => {
    const auth = await loadAuth();
    expect(auth.options.advanced?.ipAddress?.ipAddressHeaders).toEqual(["x-real-ip"]);
  });

  it("allow one caller ten sign-ups and five reset or confirm mails an hour (#582)", async () => {
    const auth = await loadAuth();
    expect(auth.options.rateLimit?.customRules).toEqual({
      "/sign-up/email": { window: 3600, max: 10 },
      "/request-password-reset": { window: 3600, max: 5 },
      "/send-verification-email": { window: 3600, max: 5 },
    });
  });
});

describe("account mail", () => {
  it("stops confirming and resetting one address past the day's cap (#582)", async () => {
    const auth = await loadAuth();
    const mail = await import("@/server/auth/email");
    const send = vi.spyOn(mail, "sendEmails").mockResolvedValue();
    const user = { email: "capped@example.test" } as never;
    for (let i = 0; i < 7; i += 1) {
      await auth.options.emailVerification?.sendVerificationEmail?.({ user, url: "https://floc.test/v", token: "t" });
      await auth.options.emailAndPassword?.sendResetPassword?.({ user, url: "https://floc.test/r", token: "t" });
    }
    expect(send).toHaveBeenCalledTimes(10);
  });
});
