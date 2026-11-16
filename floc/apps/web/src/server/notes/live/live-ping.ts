type PagesChange = { tripId: number; closed: readonly number[] };
type Listener = (change: PagesChange) => void;

const KEY = Symbol.for("floc.notesLive.pageListeners");
const listeners = ((globalThis as Record<symbol, Set<Listener>>)[KEY] ??= new Set());

export function onPagesChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function pagesChanged(tripId: number, closed: readonly number[] = []): void {
  for (const listener of listeners) listener({ tripId, closed });
}
