/**
 * Why: sign-up and forgot-password mail whatever address is typed, so anyone could make Floc send mail to a
 * stranger again and again and spend the sending domain's name (#582, as ADR-036 for inbound mail). Per
 * process, like the write limiter. Addresses are held as hashes only.
 */
import { createHash } from "node:crypto";

const DAY = 24 * 60 * 60 * 1000;

export type AccountMail = "verify" | "reset";

export function mailCap({ perDay = 5, maxKeys = 10_000 } = {}) {
  const sent = new Map<string, number[]>();

  const keyOf = (kind: AccountMail, address: string) =>
    createHash("sha256").update(`${kind}:${address.trim().toLowerCase()}`).digest("base64url");

  const prune = (now: number) => {
    for (const [key, times] of sent) {
      if (times.every((at) => now - at >= DAY)) sent.delete(key);
    }
    for (const key of sent.keys()) {
      if (sent.size < maxKeys) break;
      sent.delete(key);
    }
  };

  return {
    allow(kind: AccountMail, address: string, now = Date.now()): boolean {
      const key = keyOf(kind, address);
      const recent = (sent.get(key) ?? []).filter((at) => now - at < DAY);
      if (recent.length >= perDay) return false;
      if (!sent.has(key) && sent.size >= maxKeys) prune(now);
      sent.set(key, [...recent, now]);
      return true;
    },
    size: () => sent.size,
  };
}

export const accountMail = mailCap();
