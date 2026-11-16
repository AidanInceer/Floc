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
