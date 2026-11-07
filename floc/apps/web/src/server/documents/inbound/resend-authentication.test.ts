import { describe, expect, it, vi } from "vitest";

import { resendFromProven } from "./resend-authentication";

type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

const answering = (body: unknown, status = 200) =>
  vi.fn<Fetcher>(async () => new Response(JSON.stringify(body), { status }));

const checks = (over: Record<string, string>) => ({
  object: "email",
  id: "email-1",
  authentication: { spf: "pass", dkim: "gray", dmarc: "gray", ...over },
});

describe("whether a received email's From is proven", () => {
  it("asks Resend for the email with the key", async () => {
    const fetcher = answering(checks({ dmarc: "pass" }));
    await resendFromProven("email-1", "re_key", fetcher);

    expect(fetcher.mock.calls[0][0]).toBe("https://api.resend.com/emails/receiving/email-1");
    expect(fetcher.mock.calls[0][1]).toMatchObject({ headers: { Authorization: "Bearer re_key" } });
  });

  it("is proven by a DMARC pass", async () => {
    expect(await resendFromProven("e", "k", answering(checks({ dmarc: "pass" })))).toBe(true);
  });

  it("is proven by a DKIM pass, which Resend gives only when the signer is the From domain", async () => {
    expect(await resendFromProven("e", "k", answering(checks({ dkim: "pass" })))).toBe(true);
  });

  it("is not proven by SPF alone, which checks the envelope sender and not the From", async () => {
    expect(await resendFromProven("e", "k", answering(checks({})))).toBe(false);
  });

  it.each(["fail", "processing_failed", "unknown"])("is not proven when DKIM and DMARC are %s", async (result) => {
    expect(await resendFromProven("e", "k", answering(checks({ dkim: result, dmarc: result })))).toBe(false);
  });

  it("is not proven when Resend has no checks for it", async () => {
    expect(await resendFromProven("e", "k", answering({ object: "email", authentication: null }))).toBe(false);
  });

  it("throws when Resend cannot answer, so the webhook asks for a retry", async () => {
    await expect(resendFromProven("e", "k", answering({}, 503))).rejects.toThrow("503");
  });
});
