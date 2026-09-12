/**
 * A short-lived link that opens one file's bytes (#325 feedback).
 *
 * WHY IT EXISTS. The phone signs in with a bearer token, not a cookie, so a
 * browser handed `/trip/1/files/2/raw` lands on the sign-in page — the file
 * never opens. The app cannot put its header on a link, so the permission has
 * to ride in the link itself.
 *
 * WHAT IT GRANTS, AND FOR HOW LONG. One document, to whoever holds the URL,
 * for two minutes. It is minted only after the ordinary trip check has already
 * passed, so it never widens what its holder could see — it carries a decision
 * that was already made, it does not make one.
 *
 * SIGNED WITH THE SESSION SECRET. No second secret to leak or to forget to set
 * in a deployment, and rotating the session secret invalidates every live link.
 *
 * `timingSafeEqual` because a signature check that returns early tells an
 * attacker how much of a guess was right.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

import { requireInProduction } from "@/lib/env";

/** Two minutes: long enough to open a browser, short enough that a shared URL is dead. */
const LIFETIME_MS = 2 * 60 * 1000;

function sign(documentId: number, expiresAt: number): string {
  const secret = requireInProduction("BETTER_AUTH_SECRET", "dev-only-secret-change-me");
  return createHmac("sha256", secret)
    .update(`document:${documentId}:${expiresAt}`)
    .digest("base64url");
}

/** The `?t=` value for this document. The caller has already proved it may read it. */
export function mintViewToken(documentId: number, now = Date.now()): string {
  const expiresAt = now + LIFETIME_MS;
  return `${expiresAt}.${sign(documentId, expiresAt)}`;
}

/** True when `token` was minted for this document and has not run out. */
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
