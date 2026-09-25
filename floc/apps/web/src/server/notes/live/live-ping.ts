/**
 * "A trip's page list changed" (#408), from a Server Action or the API to the
 * live server, which tells every open Notes in that trip to read the list
 * again. Archived pages also close their open editors.
 *
 * Why globalThis: the custom server and Next's bundled server code each load
 * their own copy of this module in one process (as `live-kick`).
 */
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
