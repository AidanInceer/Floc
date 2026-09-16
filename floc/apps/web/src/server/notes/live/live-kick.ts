/**
 * Why globalThis: the custom server and Next's bundled server code each load
 * their own copy of this module in one process, so a module-level set would
 * never see the other side's registration.
 */
type Kicker = (tripId: number, userId: string) => void;

const KEY = Symbol.for("floc.notesLive.kickers");
const kickers = ((globalThis as Record<symbol, Set<Kicker>>)[KEY] ??= new Set());

export function onNotesKick(kicker: Kicker): () => void {
  kickers.add(kicker);
  return () => kickers.delete(kicker);
}

export function kickFromTripNotes(tripId: number, userId: string): void {
  for (const kick of kickers) kick(tripId, userId);
}
