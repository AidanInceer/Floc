import { HocuspocusProvider, HocuspocusProviderWebsocket } from "@hocuspocus/provider";
import { readLiveBlocks } from "@floc/core/notes/live/live-blocks";
import { notesDocumentName } from "@floc/core/notes/live/live-names";
import { liveStatus, type LiveStatus } from "@floc/core/notes/live/live-status";
import type { NoteBlock } from "@floc/core/notes/note-blocks";
import { useEffect, useState } from "react";
import * as Y from "yjs";

import { authClient } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/config";
import { readCachedNotes, writeCachedNotes } from "@/lib/notes/live-cache";
import { liveNotesUrl } from "@/lib/notes/live-url";

export type LiveNotes = { doc: Y.Doc; provider: HocuspocusProvider; blocks: NoteBlock[]; status: LiveStatus };

const CACHE_AFTER_MS = 500;

// Why the cast: the DOM typings know two arguments; React Native takes headers as a third.
const NativeSocket = WebSocket as unknown as new (
  url: string,
  protocols: string | string[] | undefined,
  options: { headers: Record<string, string> },
) => WebSocket;

// Why no epoch, unlike the web: a doc is reseeded only when it has no Yjs
// state, and since #394 nothing drops that state from a live trip.
export function useLiveNotes(tripId: number): LiveNotes | null {
  const [live, setLive] = useState<{ doc: Y.Doc; provider: HocuspocusProvider } | null>(null);
  const [blocks, setBlocks] = useState<NoteBlock[]>([]);
  const [status, setStatus] = useState<LiveStatus>("saving");

  useEffect(() => {
    if (!Number.isFinite(tripId)) return;
    const doc = new Y.Doc();
    const cached = readCachedNotes(tripId);
    if (cached) Y.applyUpdate(doc, cached);
    setBlocks(readLiveBlocks(doc));

    const cookie = authClient.getCookie();
    // Why a subclass: the server reads the session cookie, and the provider builds its own socket.
    class CookieSocket extends NativeSocket {
      constructor(url: string, protocols?: string | string[]) {
        super(url, protocols, { headers: { Cookie: cookie } });
      }
    }
    const websocketProvider = new HocuspocusProviderWebsocket({
      url: liveNotesUrl(API_BASE_URL),
      WebSocketPolyfill: CookieSocket,
    });
    const provider = new HocuspocusProvider({
      websocketProvider,
      name: notesDocumentName(tripId),
      document: doc,
      token: "session",
    });
    provider.attach();

    let failed = false;
    const update = () =>
      setStatus(
        liveStatus({
          connected: websocketProvider.status === "connected",
          synced: provider.isSynced,
          unsynced: provider.unsyncedChanges,
          failed,
        }),
      );
    provider.on("status", update);
    provider.on("synced", update);
    provider.on("unsyncedChanges", update);
    provider.on("authenticationFailed", () => {
      failed = true;
      update();
    });

    let timer: ReturnType<typeof setTimeout> | undefined;
    const onChange = () => {
      setBlocks(readLiveBlocks(doc));
      clearTimeout(timer);
      timer = setTimeout(() => writeCachedNotes(tripId, Y.encodeStateAsUpdate(doc)), CACHE_AFTER_MS);
    };
    doc.on("update", onChange);

    setLive({ doc, provider });
    return () => {
      clearTimeout(timer);
      doc.off("update", onChange);
      writeCachedNotes(tripId, Y.encodeStateAsUpdate(doc));
      provider.destroy();
      websocketProvider.destroy();
      doc.destroy();
      setLive(null);
    };
  }, [tripId]);

  return live && { ...live, blocks, status };
}
