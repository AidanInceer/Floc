"use client";

import { HocuspocusProvider, HocuspocusProviderWebsocket } from "@hocuspocus/provider";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";

import { liveCacheName } from "@floc/core/notes/live/live-epoch";
import { LIVE_NOTES_PATH, pageDocumentName, pagesDocumentName } from "@floc/core/notes/live/live-names";
import { type PresentPerson } from "@floc/core/notes/live/live-presence";
import { openLivePage, openPageList, type LivePageState, type PageCache, type PageListSession } from "@floc/core/notes/live/live-session";
import { type LiveStatus } from "@floc/core/notes/live/live-status";
import { ownEchoes } from "@floc/core/notes/live/own-echo";

export type OwnEchoes = ReturnType<typeof ownEchoes>;

type Viewer = { id: string; name: string };

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

export function usePageList(
  socket: HocuspocusProviderWebsocket | null,
  tripId: number,
  openPage: number,
  viewer: Viewer,
): { byPage: Map<number, PresentPerson[]>; echoes: OwnEchoes } {
  const router = useRouter();
  const [session, setSession] = useState<PageListSession | null>(null);
  const [byPage, setByPage] = useState(new Map<number, PresentPerson[]>());
  const echoes = useMemo(() => ownEchoes(() => router.refresh(), (run, ms) => window.setTimeout(run, ms)), [router]);

  useEffect(() => {
    if (!socket) return;
    const made = openPageList({
      connect: () => attach(new HocuspocusProvider({ websocketProvider: socket, name: pagesDocumentName(tripId), token: TOKEN })),
      onPeople: setByPage,
      onChanged: echoes.heard,
    });
    setSession(made);
    return () => {
      made.close();
      setSession(null);
    };
  }, [socket, tripId, echoes]);

  useEffect(() => session?.announce(viewer, openPage), [session, openPage, viewer]);

  return { byPage, echoes };
}

export type LivePage = { doc: Y.Doc; provider: HocuspocusProvider; status: LiveStatus; people: PresentPerson[] };

const indexedDbCache: PageCache = { open: (key, doc) => new IndexeddbPersistence(key, doc) };

export function useLivePage(socket: HocuspocusProviderWebsocket | null, tripId: number, pageId: number, epoch: string | null): LivePage | null {
  const [live, setLive] = useState<{ doc: Y.Doc; provider: HocuspocusProvider } | null>(null);
  const [state, setState] = useState<LivePageState>({ status: "opening", people: [] });
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
