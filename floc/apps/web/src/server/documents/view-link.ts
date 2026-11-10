/**
 * A short-lived link that opens one file's bytes (#325). Grants one document, to whoever holds the
 * URL, for two minutes — minted only after the ordinary trip check passed, so it carries a
 * decision rather than making one.
 *
 * Why: the phone signs in with a bearer token and cannot put its header on a link, so a browser
 * handed the raw path lands on sign-in instead of the file. Signed with `linkKey("file-view")`;
 * rotating that kills every live link. `timingSafeEqual` because a check that returns early tells
 * an attacker how much of a guess was right.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

import { linkKey } from "@/server/auth/links/link-key";

// Two minutes: long enough to open a browser, short enough that a shared URL is dead.
const LIFETIME_MS = 2 * 60 * 1000;

function sign(documentId: number, expiresAt: number): string {
  return createHmac("sha256", linkKey("file-view"))
    .update(`document:${documentId}:${expiresAt}`)
    .digest("base64url");
}

// The `?t=` value for this document. The caller has already proved it may read it.
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
