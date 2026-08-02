/**
 * The trip links aggregate (ticket 103) — the shelf beside the trip thread.
 *
 * A link is not a note. A note is something someone said, ordered by when they
 * said it; a link is a reference the group keeps and comes back to — the villa
 * listing, the ferry timetable, the shared spreadsheet. Posted into the thread
 * it is buried by the next fortnight of conversation, which is the whole reason
 * this exists. So: its own table, its own read, no `scope` column, no threading.
 *
 * The rules it owns:
 *
 * - **`http`/`https` only**, checked here as well as at the door. A stored
 *   `javascript:` URL is a stored script, and the one place that must not be
 *   trusted is the one that renders an `href` somebody else typed.
 * - **Soft-delete (rule 8)** on the read and on the update.
 * - **The label cap**, and the fallback to the host when there is no label.
 * - **A ceiling**, like every other list read.
 */
import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { tripLink, user } from "@/db/schema";
import { capText } from "@/lib/text";
import { bounded, LIMITS } from "@/server/limits";
import { touch } from "@/server/unlocks";

export type TripLinkRow = {
  id: number;
  url: string;
  label: string;
  createdBy: string;
  authorName: string;
};

/**
 * `http`/`https` and nothing else, and a URL the platform can actually parse.
 *
 * Returns the normalised string rather than a boolean so there is one answer to
 * "is this a link" and "what do we store" — two functions would eventually
 * disagree, and the one that disagreed would be the one writing the row.
 */
export function readWebUrl(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  // A bare "booking.com/..." is what people paste; assume the safe scheme
  // rather than rejecting it, since the alternative is a dead link they can't
  // see the fault in.
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
    // Oldest first: a link list is a shelf, not a feed, and things staying
    // where they were put is what makes one findable twice.
    .orderBy(asc(tripLink.id))
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
