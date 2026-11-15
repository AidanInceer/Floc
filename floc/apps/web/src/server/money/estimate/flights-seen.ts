import "server-only";

import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";

import { db } from "@/db";
import { document } from "@/db/schema";
import { LIMITS } from "@/server/limits";
import { parseBookingDetails } from "@floc/core/documents/booking/booking-details";
import type { FlightSeen } from "@floc/core/money/estimate/guide/home-airport";

/** The flights Floc read from files this member uploaded themselves (#559), for suggesting their home airport (#574). */
export async function flightsSeenBy(userId: string): Promise<FlightSeen[]> {
  const rows = await db
    .select({ tripId: document.tripId, details: document.bookingDetails })
    .from(document)
    .where(and(eq(document.uploadedBy, userId), isNotNull(document.bookingDetails), isNull(document.deletedAt)))
    .orderBy(desc(document.createdAt))
    .limit(LIMITS.documents)
    .all();
  const seen: FlightSeen[] = [];
  for (const r of rows) {
    const d = parseBookingDetails(r.details);
    if (d?.kind === "flight") seen.push({ tripId: r.tripId, date: d.date, from: d.from });
  }
  return seen;
}
