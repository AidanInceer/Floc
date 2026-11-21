import "server-only";

import { toDoFrom, type ToDoSource } from "@floc/core/trip/overview/to-do-from";
import { listPackingClaims, listPackingLines, listPersonalPackingLines } from "@/server/packing/packing";

export type Packing = Pick<ToDoSource, "bag" | "shared">;

export async function readPacking(tripId: number, viewerId: string): Promise<Packing> {
  const [lines, claims, mine] = await Promise.all([listPackingLines(tripId), listPackingClaims(tripId), listPersonalPackingLines(tripId, viewerId)]);
  const claimed = new Set(claims.map((c) => c.packingLineId));
  return {
    bag: { total: mine.length, packed: mine.filter((l) => l.packedAt !== null).length },
    shared: lines.map((l) => ({ label: l.label, claimed: claimed.has(l.id) })),
  };
}

export function toDoFor(source: Omit<ToDoSource, keyof Packing>, packing: Packing) {
  return toDoFrom({ ...source, ...packing });
}
