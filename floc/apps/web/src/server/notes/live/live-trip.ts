type Listener = (tripId: number, areas: readonly string[]) => void;

const KEY = Symbol.for("floc.notesLive.tripListeners");
const listeners = ((globalThis as Record<symbol, Set<Listener>>)[KEY] ??= new Set());

export function onTripChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function tripChanged(tripId: number, areas: readonly string[]): void {
  for (const listener of listeners) listener(tripId, areas);
}
