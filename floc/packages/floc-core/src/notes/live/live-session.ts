import * as Y from "yjs";

import { liveCacheName, readEpoch } from "./live-epoch";
import { liveUser, peopleByPage, presentPeople, type PresentPerson } from "./live-presence";
import { liveStatus, type LiveStatus } from "./live-status";

type Listener = (...args: never[]) => void;

export type SessionAwareness = {
  clientID?: number;
  getStates(): Map<number, unknown>;
  on(event: "change", cb: Listener): unknown;
  off(event: "change", cb: Listener): unknown;
  setLocalStateField(field: string, value: unknown): void;
};

/** What the session needs of a Hocuspocus provider, so it can run against a fake. */
export type SessionProvider = {
  isSynced: boolean;
  unsyncedChanges: number;
  awareness: SessionAwareness | null;
  on(event: string, cb: Listener): unknown;
  destroy(): void;
};

export type SessionSocket = {
  status: string;
  on(event: "status", cb: Listener): unknown;
  off(event: "status", cb: Listener): unknown;
};

/** Where a device keeps a page's doc between visits. */
export type PageCache = { open(key: string, doc: Y.Doc): { destroy(): void | Promise<void> } };

export type LivePageState = { status: LiveStatus; people: PresentPerson[] };

export type LivePageSession<P extends SessionProvider> = { doc: Y.Doc; provider: P; close(): void };

/**
 * One open page, the same on the web and the phone.
 * Why `cacheKey`: a cache merged into a reseeded doc doubles every block (`live-epoch`),
 * so a caller that cannot name a safe key passes null and the server's stamp picks it.
 */
export function openLivePage<P extends SessionProvider>(options: {
  name: string;
  cacheKey: string | null;
  socket: SessionSocket;
  cache: PageCache;
  connect: (doc: Y.Doc) => P;
  onChange: (state: LivePageState) => void;
}): LivePageSession<P> {
  const { socket, cache, onChange } = options;
  const doc = new Y.Doc();
  let closed = false;
  let failed = false;
  let status: LiveStatus = "saving";
  let people: PresentPerson[] = [];
  let kept = options.cacheKey === null ? null : cache.open(options.cacheKey, doc);

  const provider = options.connect(doc);
  const emit = () => {
    if (!closed) onChange({ status, people });
  };
  const refresh = () => {
    const next = liveStatus({ connected: socket.status === "connected", synced: provider.isSynced, unsynced: provider.unsyncedChanges, failed });
    if (next === status) return;
    status = next;
    emit();
  };
  const who = () => {
    people = presentPeople(provider.awareness?.getStates() ?? new Map<number, unknown>());
    emit();
  };
  const synced = () => {
    const stamped = readEpoch(doc);
    if (stamped && !closed) kept ??= cache.open(liveCacheName(options.name, stamped), doc);
    refresh();
  };
  const refused = () => {
    failed = true;
    refresh();
  };

  provider.on("status", refresh);
  socket.on("status", refresh);
  provider.on("synced", synced);
  provider.on("unsyncedChanges", refresh);
  provider.on("authenticationFailed", refused);
  provider.awareness?.on("change", who);

  return {
    doc,
    provider,
    close() {
      closed = true;
      socket.off("status", refresh);
      provider.awareness?.off("change", who);
      provider.destroy();
      void kept?.destroy();
      doc.destroy();
    },
  };
}

type Viewer = { id: string; name: string };

export type PageListSession = { announce(viewer: Viewer, openPage: number | null): void; close(): void };

/** Who has which page open, and a call whenever anyone changes the list or its comments. */
export function openPageList(options: {
  connect: () => SessionProvider;
  onPeople: (byPage: Map<number, PresentPerson[]>) => void;
  onChanged: () => void;
}): PageListSession {
  const provider = options.connect();
  const awareness = provider.awareness;
  const update = () => {
    const others = [...(awareness?.getStates() ?? new Map<number, unknown>())].filter(([client]) => client !== awareness?.clientID);
    options.onPeople(peopleByPage(new Map(others)));
  };
  awareness?.on("change", update);
  provider.on("stateless", ({ payload }: { payload: string }) => {
    if (payload === "pages") options.onChanged();
  });

  return {
    announce(viewer, openPage) {
      awareness?.setLocalStateField("user", liveUser(viewer));
      awareness?.setLocalStateField("page", openPage);
    },
    close() {
      awareness?.off("change", update);
      provider.destroy();
    },
  };
}
