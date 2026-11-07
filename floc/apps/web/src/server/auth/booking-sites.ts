import "server-only";

import {
  readBookingSites,
  toggleSite,
  type BookingSite,
  type BookingSites,
  type SiteKind,
} from "@floc/core/trip/booking-sites";
import { ensureProfile, getProfile, updateProfileFields } from "@/server/auth/profile";

export async function bookingSitesOf(userId: string): Promise<BookingSites> {
  return readBookingSites((await getProfile(userId))?.bookingSites ?? null);
}

/** Adds or drops one site; a move the rules refuse writes nothing and returns what stands. */
export async function toggleBookingSite(userId: string, kind: SiteKind, site: BookingSite): Promise<BookingSites> {
  const profile = await ensureProfile(userId);
  const now = readBookingSites(profile.bookingSites);
  const next = toggleSite(now, kind, site);
  if (next !== now) await updateProfileFields(userId, { bookingSites: next });
  return next;
}
