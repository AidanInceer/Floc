import { createHmac, timingSafeEqual } from "node:crypto";

import { linkKey } from "@/server/auth/links/link-key";

const LIFETIME_MS = 2 * 60 * 1000;

function sign(documentId: number, expiresAt: number): string {
  return createHmac("sha256", linkKey("file-view"))
    .update(`document:${documentId}:${expiresAt}`)
    .digest("base64url");
}

export function mintViewToken(documentId: number, now = Date.now()): string {
  const expiresAt = now + LIFETIME_MS;
  return `${expiresAt}.${sign(documentId, expiresAt)}`;
}

export function viewTokenHolds(
  token: string,
  documentId: number,
  now = Date.now(),
): boolean {
  const [stamp, signature] = token.split(".");
  const expiresAt = Number(stamp);
  if (!signature || !Number.isSafeInteger(expiresAt) || expiresAt < now) return false;

  const expected = Buffer.from(sign(documentId, expiresAt));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
