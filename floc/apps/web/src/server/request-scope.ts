/**
 * Why: React's `cache()` only remembers inside a Server Component render. A
 * route handler has none, so every API call loaded trip access twice. This is
 * the same memo for code run inside `withRequestScope`, and a no-op outside it.
 * Any write forgets it (`refresh`), so a read after a write is fresh.
 */
import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";

const scope = new AsyncLocalStorage<Map<string, Promise<unknown>>>();

export function withRequestScope<T>(run: () => T): T {
  return scope.run(new Map(), run);
}

export function requestMemo<T>(key: string, load: () => Promise<T>): Promise<T> {
  const memo = scope.getStore();
  if (!memo) return load();
  let hit = memo.get(key) as Promise<T> | undefined;
  if (!hit) {
    hit = load();
    memo.set(key, hit);
  }
  return hit;
}

export function forgetRequestReads(): void {
  scope.getStore()?.clear();
}
