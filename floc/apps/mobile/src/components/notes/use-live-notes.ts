/**
 * The live side of Notes on the phone (#394, #408): one socket per Notes
 * screen, carrying the open page's doc and the trip's page-list channel. The
 * open page is saved on the phone as it changes, so an edit made offline
 * outlives the app being closed and merges on reconnect.
 */
import { HocuspocusProvider, HocuspocusProviderWebsocket } from "@hocuspocus/provider";
import { pageDocumentName, pagesDocumentName } from "@floc/core/notes/live/live-names";
import { liveUser, peopleByPage, presentPeople, type PresentPerson } from "@floc/core/notes/live/live-presence";
import { liveStatus, type LiveStatus } from "@floc/core/notes/live/live-status";
import { useEffect, useState } from "react";
import * as Y from "yjs";

import { authClient } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/config";
import { readCachedNotes, writeCachedNotes } from "@/lib/notes/live-cache";
import { liveNotesUrl } from "@/lib/notes/live-url";

const CACHE_AFTER_MS = 500;
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
    const cookie = authClient.getCookie();
    // Why a subclass: the server reads the session cookie, and the provider builds its own socket.
    class CookieSocket extends NativeSocket {
      constructor(url: string, protocols?: string | string[]) {
        super(url, protocols, { headers: { Cookie: cookie } });
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

/** Who has which page open, and a call whenever anyone changes the list or its comments. */
export function usePageList(socket: HocuspocusProviderWebsocket | null, tripId: number, openPage: number | null, viewer: Viewer, onChanged: () => void) {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [byPage, setByPage] = useState(new Map<number, PresentPerson[]>());

  useEffect(() => {
    if (!socket || !Number.isFinite(tripId)) return;
    const made = new HocuspocusProvider({ websocketProvider: socket, name: pagesDocumentName(tripId), token: TOKEN });
    made.attach();
    const awareness = made.awareness;
    const update = () => {
      const states = new Map([...(awareness?.getStates() ?? new Map<number, unknown>())].filter(([client]) => client !== awareness?.clientID));
      setByPage(peopleByPage(states));
    };
    awareness?.on("change", update);
    made.on("stateless", ({ payload }: { payload: string }) => {
      if (payload === "pages") onChanged();
    });
    setProvider(made);
    return () => {
      awareness?.off("change", update);
      made.destroy();
      setProvider(null);
    };
  }, [socket, tripId, onChanged]);

  useEffect(() => {
    if (!provider?.awareness || !viewer) return;
    provider.awareness.setLocalStateField("user", liveUser(viewer));
    provider.awareness.setLocalStateField("page", openPage);
  }, [provider, openPage, viewer]);

  return byPage;
}

export type LivePage = { name: string; doc: Y.Doc; provider: HocuspocusProvider; status: LiveStatus; people: PresentPerson[] };

export function useLivePage(socket: HocuspocusProviderWebsocket | null, tripId: number, pageId: number | null): LivePage | null {
  const [live, setLive] = useState<{ name: string; doc: Y.Doc; provider: HocuspocusProvider } | null>(null);
  const [status, setStatus] = useState<LiveStatus>("saving");
  const [people, setPeople] = useState<PresentPerson[]>([]);

  useEffect(() => {
    if (!socket || pageId === null) return;
    const name = pageDocumentName(tripId, pageId);
    const doc = new Y.Doc();
    const cached = readCachedNotes(name);
    if (cached) Y.applyUpdate(doc, cached);
    const provider = new HocuspocusProvider({ websocketProvider: socket, name, document: doc, token: TOKEN });
    provider.attach();

    let failed = false;
    const update = () =>
      setStatus(liveStatus({ connected: socket.status === "connected", synced: provider.isSynced, unsynced: provider.unsyncedChanges, failed }));
    const who = () => setPeople(presentPeople(provider.awareness?.getStates() ?? new Map()));
    provider.on("status", update);
    socket.on("status", update);
    provider.on("synced", update);
    provider.on("unsyncedChanges", update);
    provider.on("authenticationFailed", () => {
      failed = true;
      update();
    });
    provider.awareness?.on("change", who);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const keep = () => {
      clearTimeout(timer);
      timer = setTimeout(() => writeCachedNotes(name, Y.encodeStateAsUpdate(doc)), CACHE_AFTER_MS);
    };
    doc.on("update", keep);

    setLive({ name, doc, provider });
    return () => {
      clearTimeout(timer);
      doc.off("update", keep);
      writeCachedNotes(name, Y.encodeStateAsUpdate(doc));
      socket.off("status", update);
      provider.awareness?.off("change", who);
      provider.destroy();
      doc.destroy();
      setLive(null);
    };
  }, [socket, tripId, pageId]);

  return live && { ...live, status, people };
}
