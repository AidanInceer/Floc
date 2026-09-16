"use client";

import { HocuspocusProvider } from "@hocuspocus/provider";
import { useEffect, useState } from "react";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";

import { liveCacheName, readEpoch } from "@floc/core/notes/live/live-epoch";
import { LIVE_NOTES_PATH, notesDocumentName } from "@floc/core/notes/live/live-names";
import { liveStatus, type LiveStatus } from "@floc/core/notes/live/live-status";

export type LiveNotes = { doc: Y.Doc; provider: HocuspocusProvider; status: LiveStatus };

/** Null until the connection objects exist — they are built in an effect so strict mode cannot reuse a destroyed one. */
export function useLiveNotes(tripId: number, epoch: string | null): LiveNotes | null {
  const [live, setLive] = useState<{ doc: Y.Doc; provider: HocuspocusProvider } | null>(null);
  const [status, setStatus] = useState<LiveStatus>("saving");

  useEffect(() => {
    const doc = new Y.Doc();
    let cache: IndexeddbPersistence | null = null;
    const keepLocally = (key: string) => (cache ??= new IndexeddbPersistence(liveCacheName(tripId, key), doc));
    if (epoch) keepLocally(epoch);

    const scheme = window.location.protocol === "https:" ? "wss" : "ws";
    const provider = new HocuspocusProvider({
      url: `${scheme}://${window.location.host}${LIVE_NOTES_PATH}`,
      name: notesDocumentName(tripId),
      document: doc,
      // Why a token at all: the provider will not send auth without one. The cookie is what the server checks.
      token: "session",
    });

    let failed = false;
    const update = () =>
      setStatus(
        liveStatus({
          connected: provider.configuration.websocketProvider.status === "connected",
          synced: provider.isSynced,
          unsynced: provider.unsyncedChanges,
          failed,
        }),
      );
    provider.on("status", update);
    provider.on("synced", () => {
      const synced = readEpoch(doc);
      if (synced) keepLocally(synced);
      update();
    });
    provider.on("unsyncedChanges", update);
    provider.on("authenticationFailed", () => {
      failed = true;
      update();
    });

    setLive({ doc, provider });
    return () => {
      provider.destroy();
      void cache?.destroy();
      doc.destroy();
      setLive(null);
    };
  }, [tripId, epoch]);

  return live && { ...live, status };
}
