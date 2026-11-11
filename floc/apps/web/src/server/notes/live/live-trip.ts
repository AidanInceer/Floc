/**
 * "This trip changed" (#577), from a write to the live server, which tells every open page of the
 * trip which areas to read again.
 *
 * Why globalThis: the custom server and Next's bundled server code each load their own copy of this
 * module in one process (as `live-kick`).
 */
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
