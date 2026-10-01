import * as Y from "yjs";
import { describe, expect, it, vi } from "vitest";

import { stampEpoch } from "./live-epoch";
import { openLivePage, openPageList, type PageCache, type SessionProvider, type SessionSocket } from "./live-session";

type Listener = (...args: never[]) => void;

function emitter() {
  const listeners = new Map<string, Set<Listener>>();
  const at = (event: string) => listeners.get(event) ?? listeners.set(event, new Set()).get(event)!;
  return {
    on: (event: string, cb: Listener) => {
      at(event).add(cb);
    },
    off: (event: string, cb: Listener) => {
      at(event).delete(cb);
    },
    emit: (event: string, ...args: unknown[]) => {
      for (const cb of at(event)) (cb as (...a: unknown[]) => void)(...args);
    },
    count: (event: string) => at(event).size,
  };
}

function fakeSocket(status = "connected") {
  const events = emitter();
  const socket: SessionSocket & { status: string } = { status, on: events.on, off: events.off };
  return { socket, events };
}

function fakeProvider() {
  const events = emitter();
  const awareness = emitter();
  const states = new Map<number, unknown>();
  const setField = vi.fn();
  const destroy = vi.fn();
  const provider: SessionProvider = {
    isSynced: false,
    unsyncedChanges: 0,
    awareness: { getStates: () => states, on: awareness.on, off: awareness.off, setLocalStateField: setField, clientID: 1 },
    on: events.on,
    destroy,
  };
  return { provider, events, awareness, states, setField, destroy };
}

function fakeCache(saved: Record<string, Uint8Array> = {}) {
  const opened: string[] = [];
  const destroyed: string[] = [];
  const cache: PageCache = {
    open: (key, doc) => {
      opened.push(key);
      if (saved[key]) Y.applyUpdate(doc, saved[key]);
      return { destroy: () => void destroyed.push(key) };
    },
  };
  return { cache, opened, destroyed };
}

function session(options: { cacheKey?: string | null; cache?: ReturnType<typeof fakeCache> } = {}) {
  const socket = fakeSocket();
  const cache = options.cache ?? fakeCache();
  const provider = fakeProvider();
  const changes: { status: string; people: unknown[] }[] = [];
  const live = openLivePage({
    name: "trip:1:page:2",
    cacheKey: options.cacheKey ?? null,
    socket: socket.socket,
    cache: cache.cache,
    connect: () => provider.provider,
    onChange: (state) => changes.push(state),
  });
  return { live, socket, cache, provider, changes };
}

describe("openLivePage", () => {
  it("goes live once synced with nothing waiting", () => {
    const { provider, changes } = session();
    provider.provider.isSynced = true;
    provider.events.emit("synced");
    expect(changes.at(-1)?.status).toBe("live");
  });

  it("goes offline when the socket drops", () => {
    const { socket, changes } = session();
    socket.socket.status = "disconnected";
    socket.events.emit("status");
    expect(changes.at(-1)?.status).toBe("offline");
  });

  it("goes offline, and stays there, when the server refuses the connection", () => {
    const { provider, changes } = session();
    provider.events.emit("authenticationFailed");
    provider.provider.isSynced = true;
    provider.events.emit("synced");
    expect(changes.at(-1)?.status).toBe("offline");
  });

  it("reports who else is here", () => {
    const { provider, changes } = session();
    provider.states.set(2, { user: { id: "u2", name: "Sam", tone: "who-3" } });
    provider.awareness.emit("change");
    expect(changes.at(-1)?.people).toEqual([{ id: "u2", name: "Sam", tone: "who-3" }]);
  });

  it("does not report a status it has already reported", () => {
    const { provider, changes } = session();
    provider.provider.isSynced = true;
    provider.events.emit("synced");
    const before = changes.length;
    provider.events.emit("unsyncedChanges");
    provider.events.emit("status");
    expect(changes.length).toBe(before);
  });

  it("keeps nothing locally until it has a key", () => {
    const { cache } = session({ cacheKey: null });
    expect(cache.opened).toEqual([]);
  });

  it("opens the local cache under the key it was given", () => {
    const { cache } = session({ cacheKey: "floc-notes:trip:1:page:2:e1" });
    expect(cache.opened).toEqual(["floc-notes:trip:1:page:2:e1"]);
  });

  it("starts from the cached doc", () => {
    const old = new Y.Doc();
    old.getText("t").insert(0, "kept offline");
    const saved = { "trip:1:page:2": Y.encodeStateAsUpdate(old) };
    const { live } = session({ cacheKey: "trip:1:page:2", cache: fakeCache(saved) });
    expect(live.doc.getText("t").toJSON()).toBe("kept offline");
  });

  it("with no key, opens the cache under the stamped epoch once the server syncs", () => {
    const { live, provider, cache } = session({ cacheKey: null });
    stampEpoch(live.doc, "e2");
    provider.events.emit("synced");
    expect(cache.opened).toEqual(["floc-notes:trip:1:page:2:e2"]);
  });

  it("with no key and no stamp, keeps nothing locally", () => {
    const { provider, cache } = session({ cacheKey: null });
    provider.events.emit("synced");
    expect(cache.opened).toEqual([]);
  });

  it("opens the cache only once across syncs", () => {
    const { live, provider, cache } = session({ cacheKey: "trip:1:page:2" });
    stampEpoch(live.doc, "e1");
    provider.events.emit("synced");
    provider.events.emit("synced");
    expect(cache.opened).toEqual(["trip:1:page:2"]);
  });

  it("tears everything down on close", () => {
    const { live, provider, socket, cache } = session({ cacheKey: "trip:1:page:2" });
    live.close();
    expect(provider.destroy).toHaveBeenCalled();
    expect(cache.destroyed).toEqual(["trip:1:page:2"]);
    expect(socket.events.count("status")).toBe(0);
    expect(provider.awareness.count("change")).toBe(0);
  });

  it("ignores events after close", () => {
    const { live, provider, changes } = session();
    live.close();
    const before = changes.length;
    provider.events.emit("synced");
    expect(changes.length).toBe(before);
  });
});

describe("openPageList", () => {
  function list() {
    const provider = fakeProvider();
    const byPage: Map<number, unknown[]>[] = [];
    const onChanged = vi.fn();
    const pageList = openPageList({ connect: () => provider.provider, onPeople: (people) => byPage.push(people), onChanged });
    return { pageList, provider, byPage, onChanged };
  }

  it("groups other people by the page they have open, leaving this client out", () => {
    const { provider, byPage } = list();
    provider.states.set(1, { user: { id: "me", name: "Me" }, page: 2 });
    provider.states.set(5, { user: { id: "u5", name: "Kim", tone: "who-2" }, page: 2 });
    provider.awareness.emit("change");
    expect([...byPage.at(-1)!.entries()]).toEqual([[2, [{ id: "u5", name: "Kim", tone: "who-2" }]]]);
  });

  it("calls back when anyone changes the page list", () => {
    const { provider, onChanged } = list();
    provider.events.emit("stateless", { payload: "pages" });
    provider.events.emit("stateless", { payload: "other" });
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it("announces the viewer and the open page", () => {
    const { pageList, provider } = list();
    pageList.announce({ id: "u1", name: "Aidan" }, 7);
    const set = provider.setField;
    expect(set).toHaveBeenCalledWith("user", expect.objectContaining({ id: "u1", name: "Aidan" }));
    expect(set).toHaveBeenCalledWith("page", 7);
  });

  it("stops listening and destroys the provider on close", () => {
    const { pageList, provider } = list();
    pageList.close();
    expect(provider.destroy).toHaveBeenCalled();
    expect(provider.awareness.count("change")).toBe(0);
  });
});
