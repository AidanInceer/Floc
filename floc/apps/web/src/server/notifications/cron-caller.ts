/** The Railway cron proves itself with `CRON_SECRET` (#345). No secret set means nobody gets in. */
import "server-only";

import { timingSafeEqual } from "node:crypto";

export function isCronCaller(authorization: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !authorization) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(authorization);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
