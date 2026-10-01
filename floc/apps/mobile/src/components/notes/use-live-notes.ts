/**
 * The live side of Notes on the phone (#394, #408): one socket per Notes
 * screen, carrying the open page's doc and the trip's page-list channel. The
 * open page is saved on the phone as it changes, so an edit made offline
 * outlives the app being closed and merges on reconnect.
 */
import { HocuspocusProvider, HocuspocusProviderWebsocket } from "@hocuspocus/provider";
import { pageDocumentName, pagesDocumentName } from "@floc/core/notes/live/live-names";
import { type PresentPerson } from "@floc/core/notes/live/live-presence";
import { openLivePage, openPageList, type LivePageState, type PageListSession } from "@floc/core/notes/live/live-session";
import { type LiveStatus } from "@floc/core/notes/live/live-status";
import { useEffect, useState } from "react";
import * as Y from "yjs";

import { authClient } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/config";
import { fileCache } from "@/lib/notes/live-cache";
import { liveNotesUrl } from "@/lib/notes/live-url";

const TOKEN = "session";

// Why the cast: the DOM typings know two arguments; React Native takes headers as a third.
const NativeSocket = WebSocket as unknown as new (
  url: string,
  protocols: string | string[] | undefined,
  options: { headers: Record<string, string> },
) => WebSocket;

export function useNotesSocket(): HocuspocusProviderWebsocket | null {
  const [socket, setSocket] = useState<HocuspocusProviderWebsocket | null>(null);
  useEffect(() => {
    // Why a subclass: the server reads the session cookie, and the provider builds its own socket.
    // The cookie is read per connection, so a reconnect after the session renews sends the new one.
    class CookieSocket extends NativeSocket {
      constructor(url: string, protocols?: string | string[]) {
        super(url, protocols, { headers: { Cookie: authClient.getCookie() } });
      }
    }
    const made = new HocuspocusProviderWebsocket({ url: liveNotesUrl(API_BASE_URL), WebSocketPolyfill: CookieSocket });
    setSocket(made);
    return () => {
      made.destroy();
      setSocket(null);
    };
  }, []);
  return socket;
}

type Viewer = { id: string; name: string } | null;

const attach = (provider: HocuspocusProvider) => {
  provider.attach();
  return provider;
};

/** Who has which page open, and a call whenever anyone changes the list or its comments. */
export function usePageList(socket: HocuspocusProviderWebsocket | null, tripId: number, openPage: number | null, viewer: Viewer, onChanged: () => void) {
  const [session, setSession] = useState<PageListSession | null>(null);
  const [byPage, setByPage] = useState(new Map<number, PresentPerson[]>());

  useEffect(() => {
    if (!socket || !Number.isFinite(tripId)) return;
    const made = openPageList({
      connect: () => attach(new HocuspocusProvider({ websocketProvider: socket, name: pagesDocumentName(tripId), token: TOKEN })),
      onPeople: setByPage,
      onChanged,
    });
    setSession(made);
    return () => {
      made.close();
      setSession(null);
    };
  }, [socket, tripId, onChanged]);

  useEffect(() => {
    if (viewer) session?.announce(viewer, openPage);
  }, [session, openPage, viewer]);

  return byPage;
}

export type LivePage = { name: string; doc: Y.Doc; provider: HocuspocusProvider; status: LiveStatus; people: PresentPerson[] };

export function useLivePage(socket: HocuspocusProviderWebsocket | null, tripId: number, pageId: number | null): LivePage | null {
  const [live, setLive] = useState<{ name: string; doc: Y.Doc; provider: HocuspocusProvider } | null>(null);
  const [state, setState] = useState<LivePageState>({ status: "saving", people: [] });

  useEffect(() => {
    if (!socket || pageId === null) return;
    const name = pageDocumentName(tripId, pageId);
    const session = openLivePage({
      name,
      // Why the name: the phone cannot learn the page's epoch before it connects, so it keeps one cache per page.
      cacheKey: name,
      socket,
      cache: fileCache,
      connect: (doc) => attach(new HocuspocusProvider({ websocketProvider: socket, name, document: doc, token: TOKEN })),
      onChange: setState,
    });
    setLive({ name, doc: session.doc, provider: session.provider });
    return () => {
      session.close();
      setLive(null);
    };
  }, [socket, tripId, pageId]);

  return live && { ...live, ...state };
}
