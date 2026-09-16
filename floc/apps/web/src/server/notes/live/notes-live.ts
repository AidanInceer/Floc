/**
 * The live Notes server (#391): Hocuspocus, one Yjs doc per trip. Runs inside
 * floc-web's custom server; the socket wiring lives there.
 */
import { Hocuspocus } from "@hocuspocus/server";
import * as Y from "yjs";

import { isLiveMember } from "./live-access";
import { stampEpoch } from "@floc/core/notes/live/live-epoch";
import { notesDocumentName, tripIdOf } from "@floc/core/notes/live/live-names";
import { blocksJson, seedFromJson } from "./live-doc";
import { onNotesKick } from "./live-kick";
import { loadLiveState, storeLiveState } from "./live-store";

type LiveContext = { userId: string };

// Why seed an empty doc: two editors opening a blank one would each create
// their own root group, and BlockNote reads only the first.
const EMPTY_DOC = JSON.stringify([{ type: "paragraph" }]);

export { notesDocumentName };

export function createNotesLive(options: {
  resolveUser: (headers: Headers) => Promise<string | null>;
  debounce?: number;
}): Hocuspocus<LiveContext> {
  const live: Hocuspocus<LiveContext> = new Hocuspocus<LiveContext>({
    quiet: true,
    debounce: options.debounce ?? 2_000,
    maxDebounce: 10_000,

    async onAuthenticate({ documentName, requestHeaders, context }) {
      const userId = await options.resolveUser(requestHeaders);
      if (!userId) throw new Error("Not signed in");
      const tripId = tripIdOf(documentName);
      if (tripId === null || !(await isLiveMember(tripId, userId))) {
        throw new Error("Not found");
      }
      context.userId = userId;
    },

    async onLoadDocument({ documentName, document }) {
      const tripId = tripIdOf(documentName);
      if (tripId === null) throw new Error("Not found");
      const { state, body } = await loadLiveState(tripId);
      if (state) Y.applyUpdate(document, state);
      else {
        seedFromJson(document, body ?? EMPTY_DOC);
        stampEpoch(document, crypto.randomUUID());
      }
      return document;
    },

    async onStoreDocument({ documentName, document, lastContext }) {
      const tripId = tripIdOf(documentName);
      if (tripId === null || !lastContext?.userId) return;
      await storeLiveState(tripId, lastContext.userId, Y.encodeStateAsUpdate(document), blocksJson(document));
    },
  });

  const stop = onNotesKick((tripId, userId) => {
    const document = live.documents.get(notesDocumentName(tripId));
    for (const connection of document?.getConnections() ?? []) {
      if (connection.context?.userId === userId) connection.close();
    }
  });
  live.configure({ extensions: [{ async onDestroy() { stop(); } }] });

  return live;
}
