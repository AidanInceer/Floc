/**
 * Why: a shared trip link that leaked let new people in for ever (ADR-047). It now carries its own end date, signed.
 * The trip's token stays inside, so an admin's reset still ends every link at once. Key: `linkKey("invite-link")`.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

import { INVITE_LINK_DAYS } from "@floc/core/trip/group/invite-link";

import { linkKey } from "@/server/auth/links/link-key";

const LIFETIME_MS = INVITE_LINK_DAYS * 24 * 60 * 60 * 1000;

/** Why: links sent before ADR-047 are the bare token with no date. They keep working until here, then stop. */
export const BARE_LINKS_END = Date.UTC(2026, 10, 25);

// 22 base64url characters: 132 bits, past guessing, and the link stays short enough to paste.
const SIGNATURE_LENGTH = 22;

function sign(inviteToken: string, end: string): string {
  return createHmac("sha256", linkKey("invite-link"))
    .update(`invite:${inviteToken}:${end}`)
    .digest("base64url")
    .slice(0, SIGNATURE_LENGTH);
}

export function mintShareToken(inviteToken: string, now = Date.now()): string {
  const end = (now + LIFETIME_MS).toString(36);
  return `${inviteToken}.${end}.${sign(inviteToken, end)}`;
}

/** The trip's invite token the link names, or null when it is made up, changed or past its end. */
export function readShareToken(raw: string, now = Date.now()): string | null {
  const parts = raw.split(".");
  if (parts.length === 1) return raw && now < BARE_LINKS_END ? raw : null;
  const [inviteToken, end, signature] = parts;
  if (parts.length !== 3 || !inviteToken || !end || !signature) return null;

  const expected = Buffer.from(sign(inviteToken, end));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return Number.parseInt(end, 36) >= now ? inviteToken : null;
}
