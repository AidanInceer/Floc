import { createHmac, timingSafeEqual } from "node:crypto";

import { linkKey } from "@/server/auth/links/link-key";

export type MediaLinkPurpose = "upload" | "view";

const LIFETIME_MS: Record<MediaLinkPurpose, number> = {
  upload: 30 * 60 * 1000,
  view: 60 * 60 * 1000,
};

function sign(purpose: MediaLinkPurpose, userId: string, tripId: number, expiresAt: number): string {
  return createHmac("sha256", linkKey("file-view"))
    .update(`media:${purpose}:${tripId}:${userId}:${expiresAt}`)
    .digest("base64url");
}

const STEADY_MS = 10 * 60 * 1000;

const expiryFor = (purpose: MediaLinkPurpose, now: number) =>
  purpose === "view"
    ? Math.ceil((now + LIFETIME_MS.view) / STEADY_MS) * STEADY_MS
    : now + LIFETIME_MS.upload;

export function mintMediaToken(purpose: MediaLinkPurpose, userId: string, tripId: number, now = Date.now()): string {
  const expiresAt = expiryFor(purpose, now);
  const who = Buffer.from(userId).toString("base64url");
  return `${expiresAt}.${who}.${sign(purpose, userId, tripId, expiresAt)}`;
}

export function mediaTokenHolder(
  token: string,
  purpose: MediaLinkPurpose,
  tripId: number,
  now = Date.now(),
): string | null {
  const [stamp, who, signature] = token.split(".");
  const expiresAt = Number(stamp);
  if (!who || !signature || !Number.isSafeInteger(expiresAt) || expiresAt < now) return null;
  const userId = Buffer.from(who, "base64url").toString();
  const expected = Buffer.from(sign(purpose, userId, tripId, expiresAt));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given) ? userId : null;
}
