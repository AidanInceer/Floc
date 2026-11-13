import { describe, expect, it, vi } from "vitest";

import { readReceived, resendReceived } from "./resend-received";

describe("what Resend says about a received mail (#559)", () => {
  it("believes the From on a DMARC pass or a DKIM pass, and on nothing else", () => {
    expect(readReceived({ authentication: { dmarc: "pass" } }).proven).toBe(true);
    expect(readReceived({ authentication: { dkim: "pass", dmarc: "fail" } }).proven).toBe(true);
    expect(readReceived({ authentication: { spf: "pass", dkim: "fail", dmarc: "fail" } }).proven).toBe(false);
    expect(readReceived({ authentication: null }).proven).toBe(false);
    expect(readReceived({}).proven).toBe(false);
  });

  it("hands on the HTML, and drops one too big to read", () => {
    expect(readReceived({ html: "<p>Hi</p>" }).html).toBe("<p>Hi</p>");
    expect(readReceived({ html: "x".repeat(2_000_001) }).html).toBeNull();
    expect(readReceived({ html: null }).html).toBeNull();
  });

  it("spots mail that must not be answered", () => {
    expect(readReceived({ headers: { "Auto-Submitted": "auto-replied" } }).automated).toBe(true);
    expect(readReceived({ headers: { "auto-submitted": "no" } }).automated).toBe(false);
    expect(readReceived({ headers: { Precedence: "bulk" } }).automated).toBe(true);
    expect(readReceived({ headers: [{ name: "List-Unsubscribe", value: "<mailto:x@y.test>" }] }).automated).toBe(true);
    expect(readReceived({ headers: { Subject: "Fwd: your booking" } }).automated).toBe(false);
  });

  it("spots a mail with more than one From", () => {
    expect(readReceived({ headers: { From: "Mo <mo@example.test>" } }).severalFrom).toBe(false);
    expect(readReceived({ headers: { From: "a@evil.test, Mo <mo@example.test>" } }).severalFrom).toBe(true);
    expect(readReceived({ headers: [{ name: "From", value: "a@evil.test" }, { name: "from", value: "mo@example.test" }] }).severalFrom).toBe(true);
    expect(readReceived({ headers: { From: ["a@evil.test", "mo@example.test"] } }).severalFrom).toBe(true);
  });

  it("asks Resend for this mail, with the key", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ authentication: { dkim: "pass" }, html: "<p>x</p>" })));
    expect(await resendReceived("e 1", "re_test", fetcher)).toMatchObject({ proven: true, html: "<p>x</p>" });
    expect(fetcher).toHaveBeenCalledWith("https://api.resend.com/emails/receiving/e%201", { headers: { Authorization: "Bearer re_test" } });
  });

  it("throws when Resend does not answer, so the webhook is retried", async () => {
    await expect(resendReceived("e1", "re_test", async () => new Response("no", { status: 500 }))).rejects.toThrow("500");
  });
});
