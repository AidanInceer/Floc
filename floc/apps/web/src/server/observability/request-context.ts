import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

type RequestContext = { requestId: string };

const KEY = Symbol.for("floc.request-context");
const holder = globalThis as unknown as Record<symbol, AsyncLocalStorage<RequestContext> | undefined>;
const store = (holder[KEY] ??= new AsyncLocalStorage<RequestContext>());

const REQUEST_ID = /^[A-Za-z0-9_-]{8,64}$/;

export function requestIdFrom(header: string | string[] | undefined): string {
  const given = Array.isArray(header) ? header[0] : header;
  return given && REQUEST_ID.test(given) ? given : randomUUID();
}

export function withRequestContext<T>(context: RequestContext, run: () => T): T {
  return store.run(context, run);
}

export function currentRequestId(): string | undefined {
  return store.getStore()?.requestId;
}
