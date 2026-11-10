import { describe, expect, it, vi } from "vitest";

describe("sign-in rate limits", () => {
  // Why the long timeout: a cold import of Better Auth alone can pass 5 s on a busy machine.
  it("key each caller by the address Railway's edge sets in X-Real-IP", async () => {
    const { auth } = await vi.importActual<typeof import("./auth")>("./auth");
    expect(auth.options.advanced?.ipAddress?.ipAddressHeaders).toEqual(["x-real-ip"]);
  }, 30_000);

  it("allow one caller ten sign-ups and five reset or confirm mails an hour (#582)", async () => {
    const { auth } = await vi.importActual<typeof import("./auth")>("./auth");
    expect(auth.options.rateLimit?.customRules).toEqual({
      "/sign-up/email": { window: 3600, max: 10 },
      "/request-password-reset": { window: 3600, max: 5 },
      "/send-verification-email": { window: 3600, max: 5 },
    });
  }, 30_000);
});

describe("account mail", () => {
  it("stops confirming and resetting one address past the day's cap (#582)", async () => {
    const { auth } = await vi.importActual<typeof import("./auth")>("./auth");
    const mail = await import("@/server/auth/email");
    const send = vi.spyOn(mail, "sendEmails").mockResolvedValue();
    const user = { email: "capped@example.test" } as never;
    for (let i = 0; i < 7; i += 1) {
      await auth.options.emailVerification?.sendVerificationEmail?.({ user, url: "https://floc.test/v", token: "t" });
      await auth.options.emailAndPassword?.sendResetPassword?.({ user, url: "https://floc.test/r", token: "t" });
    }
    expect(send).toHaveBeenCalledTimes(10);
  }, 30_000);
});
