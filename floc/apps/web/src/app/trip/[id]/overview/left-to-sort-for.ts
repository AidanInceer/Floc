import "server-only";

import { leftToSortFrom, type LeftToSortSource } from "@floc/core/trip/overview/left-to-sort-from";
import { listPackingClaims, listPackingLines } from "@/server/packing/packing";

export type SharedPacking = LeftToSortSource["shared"];

// Why: it needs nothing from the ledger, so the page starts it with its other reads instead of after settle-up (#perf).
export async function readSharedPacking(tripId: number): Promise<SharedPacking> {
  const [lines, claims] = await Promise.all([listPackingLines(tripId), listPackingClaims(tripId)]);
  const claimed = new Set(claims.map((c) => c.packingLineId));
  return lines.map((l) => ({ label: l.label, claimed: claimed.has(l.id) }));
}

export function leftToSortFor(source: Omit<LeftToSortSource, "shared">, shared: SharedPacking) {
  return leftToSortFrom({ ...source, shared });
}
