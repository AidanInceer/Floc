type Kicker = (tripId: number | null, userId?: string) => void;

const KEY = Symbol.for("floc.notesLive.kickers");
const kickers = ((globalThis as Record<symbol, Set<Kicker>>)[KEY] ??= new Set());

export function onNotesKick(kicker: Kicker): () => void {
  kickers.add(kicker);
  return () => kickers.delete(kicker);
}

export function kickFromTripNotes(tripId: number | null, userId?: string): void {
  for (const kick of kickers) kick(tripId, userId);
}
