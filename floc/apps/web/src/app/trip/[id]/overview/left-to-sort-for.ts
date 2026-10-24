import "server-only";

import { leftToSortFrom, type LeftToSortSource } from "@floc/core/trip/overview/left-to-sort-from";
import { listPackingClaims, listPackingLines } from "@/server/packing/packing";

/** Adds the packing list, the one fact the Overview does not already read, and builds the list (#460). */
export async function leftToSortFor(tripId: number, source: Omit<LeftToSortSource, "shared">) {
  const [lines, claims] = await Promise.all([listPackingLines(tripId), listPackingClaims(tripId)]);
  const claimed = new Set(claims.map((c) => c.packingLineId));
  return leftToSortFrom({ ...source, shared: lines.map((l) => ({ label: l.label, claimed: claimed.has(l.id) })) });
}
