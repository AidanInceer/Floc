/**
 * The trip links aggregate (ticket 103) — the shelf beside the trip thread. A
 * link is a reference the group keeps and comes back to (villa listing, ferry
 * timetable), not a chronological note that gets buried by the next
 * fortnight's conversation — hence its own table, no `scope` column, no
 * threading.
 *
 * Owns: `http`/`https`-only enforcement (a stored `javascript:` URL is a
 * stored script, and this renders an `href` someone else typed); soft-delete;
 * the label cap and host fallback; the list ceiling.
 */
import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { tripLink, user } from "@/db/schema";
import { capText } from "@/lib/text";
import { bounded, LIMITS } from "@/server/limits";
import { touch } from "@/server/audit";

export type TripLinkRow = {
  id: number;
  url: string;
  label: string;
  createdBy: string;
  authorName: string;
};

/** Returns the normalised string, not a boolean, so "is this a link" and "what do we store" can't disagree. */
export function readWebUrl(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  // Bare "booking.com/..." is what people paste; assume https rather than reject it.
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  return url.toString().slice(0, LINK_URL_MAX);
}

/** Longer than any real link is worth keeping, short enough to bound the row. */
export const LINK_URL_MAX = 2000;

/** What to show when nobody typed a label: the host, which is the useful half. */
export function labelFor(url: string, label: string | null): string {
  if (label) return label;
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export async function listTripLinks(tripId: number): Promise<TripLinkRow[]> {
  const rows = await db
    .select({
      id: tripLink.id,
      url: tripLink.url,
      label: tripLink.label,
      createdBy: tripLink.createdBy,
      authorName: user.name,
    })
    .from(tripLink)
    .innerJoin(user, eq(user.id, tripLink.createdBy))
    .where(and(eq(tripLink.tripId, tripId), isNull(tripLink.deletedAt)))
    .orderBy(asc(tripLink.id)) // oldest first: a shelf, not a feed
    .limit(LIMITS.tripLinks)
    .all();

  return bounded(rows, "tripLinks", `trip ${tripId}`).map((r) => ({
    ...r,
    label: labelFor(r.url, r.label),
  }));
}

export async function insertTripLink(args: {
  tripId: number;
  createdBy: string;
  url: string;
  label: string | null;
}): Promise<void> {
  await db.insert(tripLink).values({
    tripId: args.tripId,
    createdBy: args.createdBy,
    url: args.url,
    label: capText(args.label, "linkLabel"),
  });
}

export async function softDeleteTripLink(linkId: number): Promise<void> {
  await db
    .update(tripLink)
    .set({ deletedAt: new Date(), ...touch() })
    .where(and(eq(tripLink.id, linkId), isNull(tripLink.deletedAt)));
}

/** The one link belonging to this trip, or undefined — never another trip's. */
export async function findTripLink(tripId: number, linkId: number) {
  return db
    .select({ id: tripLink.id, createdBy: tripLink.createdBy })
    .from(tripLink)
    .where(
      and(
        eq(tripLink.id, linkId),
        eq(tripLink.tripId, tripId),
        isNull(tripLink.deletedAt),
      ),
    )
    .get();
}

/** Links live in the pane on Days, so that is the page to refresh. */
export function revalidateTripLinks(tripId: number): void {
  revalidatePath(`/trip/${tripId}/days`);
}
