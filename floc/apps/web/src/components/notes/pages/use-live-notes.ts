/**
 * The live side of Notes in the browser (#391, #408): one socket per open
 * Notes tab, carrying the open page's doc and the trip's page-list channel.
 * Edits made offline stay in IndexedDB and merge on reconnect.
 */
"use client";

import { HocuspocusProvider, HocuspocusProviderWebsocket } from "@hocuspocus/provider";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";

import { liveCacheName, readEpoch } from "@floc/core/notes/live/live-epoch";
import { LIVE_NOTES_PATH, pageDocumentName, pagesDocumentName } from "@floc/core/notes/live/live-names";
import { liveUser, peopleByPage, presentPeople, type PresentPerson } from "@floc/core/notes/live/live-presence";
import { liveStatus, type LiveStatus } from "@floc/core/notes/live/live-status";

type Viewer = { id: string; name: string };

/** Why a token at all: the provider will not send auth without one. The cookie is what the server checks. */
const TOKEN = "session";

export function useNotesSocket(): HocuspocusProviderWebsocket | null {
  const [socket, setSocket] = useState<HocuspocusProviderWebsocket | null>(null);
  useEffect(() => {
    const scheme = window.location.protocol === "https:" ? "wss" : "ws";
    const made = new HocuspocusProviderWebsocket({ url: `${scheme}://${window.location.host}${LIVE_NOTES_PATH}` });
    setSocket(made);
    return () => {
      made.destroy();
      setSocket(null);
    };
  }, []);
  return socket;
}

/** Who has which page open, and a fresh read of the list whenever anyone changes it. */
export function usePageList(socket: HocuspocusProviderWebsocket | null, tripId: number, openPage: number, viewer: Viewer): Map<number, PresentPerson[]> {
  const router = useRouter();
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [byPage, setByPage] = useState(new Map<number, PresentPerson[]>());

  useEffect(() => {
    if (!socket) return;
    const made = new HocuspocusProvider({ websocketProvider: socket, name: pagesDocumentName(tripId), token: TOKEN });
    made.attach();
    const awareness = made.awareness;
    const update = () => {
      const states = new Map([...(awareness?.getStates() ?? new Map<number, unknown>())].filter(([client]) => client !== awareness?.clientID));
      setByPage(peopleByPage(states));
    };
    awareness?.on("change", update);
    made.on("stateless", ({ payload }: { payload: string }) => {
      if (payload === "pages") router.refresh();
    });
    setProvider(made);
    return () => {
      awareness?.off("change", update);
      made.destroy();
      setProvider(null);
    };
  }, [socket, tripId, router]);

  useEffect(() => {
    provider?.awareness?.setLocalStateField("user", liveUser(viewer));
    provider?.awareness?.setLocalStateField("page", openPage);
  }, [provider, openPage, viewer]);

  return byPage;
}

export type LivePage = { doc: Y.Doc; provider: HocuspocusProvider; status: LiveStatus; people: PresentPerson[] };

/** Null until the connection objects exist — they are built in an effect so strict mode cannot reuse a destroyed one. */
export function useLivePage(socket: HocuspocusProviderWebsocket | null, tripId: number, pageId: number, epoch: string | null): LivePage | null {
  const [live, setLive] = useState<{ doc: Y.Doc; provider: HocuspocusProvider } | null>(null);
  const [status, setStatus] = useState<LiveStatus>("saving");
  const [people, setPeople] = useState<PresentPerson[]>([]);
  // Why only the first: a refresh after this person's first edit brings the epoch the server just
  // stamped, and rebuilding the doc for it would drop the page from under the caret.
  const firstEpoch = useRef(epoch);

  useEffect(() => {
    if (!socket) return;
    const name = pageDocumentName(tripId, pageId);
    const epoch = firstEpoch.current;
    const doc = new Y.Doc();
    let cache: IndexeddbPersistence | null = null;
    const keepLocally = (key: string) => (cache ??= new IndexeddbPersistence(liveCacheName(name, key), doc));
    if (epoch) keepLocally(epoch);
    const provider = new HocuspocusProvider({ websocketProvider: socket, name, document: doc, token: TOKEN });
    provider.attach();

    let failed = false;
    const update = () =>
      setStatus(liveStatus({ connected: socket.status === "connected", synced: provider.isSynced, unsynced: provider.unsyncedChanges, failed }));
    const who = () => setPeople(presentPeople(provider.awareness?.getStates() ?? new Map()));
    provider.on("status", update);
    socket.on("status", update);
    provider.on("synced", () => {
      const stamped = readEpoch(doc);
      if (stamped) keepLocally(stamped);
      update();
    });
    provider.on("unsyncedChanges", update);
    provider.on("authenticationFailed", () => {
      failed = true;
      update();
    });
    provider.awareness?.on("change", who);

    setLive({ doc, provider });
    return () => {
      socket.off("status", update);
      provider.awareness?.off("change", who);
      provider.destroy();
      void cache?.destroy();
      doc.destroy();
      setLive(null);
    };
  }, [socket, tripId, pageId]);

  return live && { ...live, status, people };
}
