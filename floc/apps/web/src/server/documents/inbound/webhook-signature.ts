/**
 * Resend signs its webhooks the Svix way: HMAC-SHA256 over `id.timestamp.body`
 * with the base64 key after `whsec_`. Checked here by hand because the
 * installed `resend` SDK predates receiving (#328).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

// Why: a request captured off the wire is worthless after this.
const TOLERANCE_MS = 5 * 60 * 1000;

export function webhookSigned(
  body: string,
  headers: Headers,
  secret: string,
  now = Date.now(),
): boolean {
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signatures = headers.get("svix-signature");
  if (!id || !timestamp || !signatures) return false;

  const sentAt = Number(timestamp) * 1000;
  if (!Number.isFinite(sentAt) || Math.abs(now - sentAt) > TOLERANCE_MS) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = Buffer.from(
    createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64"),
  );

  return signatures.split(" ").some((entry) => {
    const given = Buffer.from(entry.replace(/^v1,/, ""));
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
