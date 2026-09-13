import "server-only";

import { createHash } from "node:crypto";

// Why: Apple's appAccountToken must be a UUID and Better Auth ids are not. Derived, so nothing is stored.
export function accountTokenFor(userId: string): string {
  const hash = createHash("sha256").update(`floc-account:${userId}`).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
