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

import { liveCacheName } from "@floc/core/notes/live/live-epoch";
import { LIVE_NOTES_PATH, pageDocumentName, pagesDocumentName } from "@floc/core/notes/live/live-names";
import { type PresentPerson } from "@floc/core/notes/live/live-presence";
import { openLivePage, openPageList, type LivePageState, type PageCache, type PageListSession } from "@floc/core/notes/live/live-session";
import { type LiveStatus } from "@floc/core/notes/live/live-status";

type Viewer = { id: string; name: string };

/** Why a token at all: the provider will not send auth without one. The cookie is what the server checks. */
const TOKEN = "session";

const attach = (provider: HocuspocusProvider) => {
  provider.attach();
  return provider;
};

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
  const [session, setSession] = useState<PageListSession | null>(null);
  const [byPage, setByPage] = useState(new Map<number, PresentPerson[]>());

  useEffect(() => {
    if (!socket) return;
    const made = openPageList({
      connect: () => attach(new HocuspocusProvider({ websocketProvider: socket, name: pagesDocumentName(tripId), token: TOKEN })),
      onPeople: setByPage,
      onChanged: () => router.refresh(),
    });
    setSession(made);
    return () => {
      made.close();
      setSession(null);
    };
  }, [socket, tripId, router]);

  useEffect(() => session?.announce(viewer, openPage), [session, openPage, viewer]);

  return byPage;
}

export type LivePage = { doc: Y.Doc; provider: HocuspocusProvider; status: LiveStatus; people: PresentPerson[] };

const indexedDbCache: PageCache = { open: (key, doc) => new IndexeddbPersistence(key, doc) };

/** Null until the connection objects exist — they are built in an effect so strict mode cannot reuse a destroyed one. */
export function useLivePage(socket: HocuspocusProviderWebsocket | null, tripId: number, pageId: number, epoch: string | null): LivePage | null {
  const [live, setLive] = useState<{ doc: Y.Doc; provider: HocuspocusProvider } | null>(null);
  const [state, setState] = useState<LivePageState>({ status: "saving", people: [] });
  // Why only the first: a refresh after this person's first edit brings the epoch the server just
  // stamped, and rebuilding the doc for it would drop the page from under the caret.
  const firstEpoch = useRef(epoch);

  useEffect(() => {
    if (!socket) return;
    const name = pageDocumentName(tripId, pageId);
    const session = openLivePage({
      name,
      cacheKey: firstEpoch.current ? liveCacheName(name, firstEpoch.current) : null,
      socket,
      cache: indexedDbCache,
      connect: (doc) => attach(new HocuspocusProvider({ websocketProvider: socket, name, document: doc, token: TOKEN })),
      onChange: setState,
    });
    setLive({ doc: session.doc, provider: session.provider });
    return () => {
      session.close();
      setLive(null);
    };
  }, [socket, tripId, pageId]);

  return live && { ...live, ...state };
}
