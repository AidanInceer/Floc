import "server-only";

import { and, count, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { tripLink } from "@/db/schema";
import { assertRoom } from "@/server/limits";
import { capText } from "@floc/core/text/text";
import { touch } from "@/server/audit";

export function readWebUrl(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
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

const LINK_URL_MAX = 2000;

export function labelFor(url: string, label: string | null): string {
  if (label) return label;
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}


export async function insertTripLink(args: {
  tripId: number;
  createdBy: string;
  url: string;
  label: string | null;
}): Promise<void> {
  const [{ n }] = await db.select({ n: count() }).from(tripLink).where(and(eq(tripLink.tripId, args.tripId), isNull(tripLink.deletedAt)));
  assertRoom("tripLinks", n);
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

