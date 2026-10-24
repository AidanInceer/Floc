import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { webhookSigned } from "./webhook-signature";

const key = Buffer.from("a-test-signing-key-of-some-length");
const secret = `whsec_${key.toString("base64")}`;
const now = 1_760_000_000_000;

function headersFor(body: string, at = now, signWith = key) {
  const id = "msg_1";
  const timestamp = String(Math.floor(at / 1000));
  const signature = createHmac("sha256", signWith)
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");
  return new Headers({
    "svix-id": id,
    "svix-timestamp": timestamp,
    "svix-signature": `v1,${signature}`,
  });
}

describe("a Resend webhook signature (#328)", () => {
  const body = JSON.stringify({ type: "email.received" });

  it("holds for the body it was made for", () => {
    expect(webhookSigned(body, headersFor(body), secret, now)).toBe(true);
  });

  it("fails when the body changed", () => {
    expect(webhookSigned(`${body} `, headersFor(body), secret, now)).toBe(false);
  });

  it("fails when signed with another key", () => {
    expect(webhookSigned(body, headersFor(body, now, Buffer.from("other")), secret, now)).toBe(false);
  });

  it("fails when it is older than five minutes, so a captured request cannot be replayed", () => {
    expect(webhookSigned(body, headersFor(body, now - 6 * 60 * 1000), secret, now)).toBe(false);
  });

  it("holds when any one of several signatures matches, as during a key rotation", () => {
    const headers = headersFor(body);
    headers.set("svix-signature", `v1,bm90LWl0 ${headers.get("svix-signature")}`);
    expect(webhookSigned(body, headers, secret, now)).toBe(true);
  });

  it("fails with no signature headers", () => {
    expect(webhookSigned(body, new Headers(), secret, now)).toBe(false);
  });
});
