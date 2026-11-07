/**
 * The live notes server (#391, #408): Hocuspocus, one Yjs doc per notes page,
 * and one per trip for its page list — who has which page open, and "the list
 * changed". Runs inside floc-web's custom server; the socket wiring lives there.
 */
import { Hocuspocus } from "@hocuspocus/server";
import * as Y from "yjs";

import { stampEpoch } from "@floc/core/notes/live/live-epoch";
import { pageDocumentName, pagesDocumentName, readDocumentName, type LiveDocument } from "@floc/core/notes/live/live-names";
import { parsePageBody, serialisePage } from "@floc/core/notes/pages/page-blocks";
import { readPageYjs, seedPageYjs } from "@floc/core/notes/pages/page-yjs";
import { isLiveMember, isOpenPage } from "./live-access";
import { onNotesKick } from "./live-kick";
import { onPagesChanged } from "./live-ping";
import { LIVE_STATE_MAX_BYTES, loadPageState, storePageState } from "./page-live-store";

type LiveContext = { userId: string; checkedAt: number };

/**
 * Why: a check per keystroke costs a session fetch and two queries. Removal and
 * archive close the socket at once; this catches the rest, such as a session that ended.
 */
const RECHECK_MS = 60_000;

const PAGES_CHANGED = "pages";

/** Why: measuring a whole doc on every keystroke is costly, so it is measured each time this much has arrived. */
const MEASURE_EVERY_BYTES = 256 * 1024;

async function mayOpen(target: LiveDocument | null, userId: string): Promise<boolean> {
  if (!target) return false;
  const [member, open] = await Promise.all([
    isLiveMember(target.tripId, userId),
    target.kind === "pages" || isOpenPage(target.tripId, target.pageId),
  ]);
  return member && open;
}

export function createNotesLive(options: {
  resolveUser: (headers: Headers) => Promise<string | null>;
  debounce?: number;
  recheckMs?: number;
}): Hocuspocus<LiveContext> {
  const recheckMs = options.recheckMs ?? RECHECK_MS;
  const arrived = new Map<string, number>();
  const live: Hocuspocus<LiveContext> = new Hocuspocus<LiveContext>({
    quiet: true,
    debounce: options.debounce ?? 2_000,
    maxDebounce: 10_000,

    async onAuthenticate({ documentName, requestHeaders, context, connectionConfig }) {
      const userId = await options.resolveUser(requestHeaders);
      if (!userId) throw new Error("Not signed in");
      const target = readDocumentName(documentName);
      if (!(await mayOpen(target, userId))) throw new Error("Not found");
      // Why: the page list only carries who is where (awareness), so no client may write content into it.
      if (connectionConfig && target?.kind === "pages") connectionConfig.readOnly = true;
      context.userId = userId;
      context.checkedAt = Date.now();
    },

    async beforeHandleMessage({ documentName, requestHeaders, context }) {
      if (Date.now() - context.checkedAt < recheckMs) return;
      const userId = await options.resolveUser(requestHeaders);
      if (!userId || userId !== context.userId || !(await mayOpen(readDocumentName(documentName), userId))) {
        throw new Error("Not found");
      }
      context.checkedAt = Date.now();
    },

    async onChange({ documentName, document, update }) {
      const since = (arrived.get(documentName) ?? 0) + update.byteLength;
      arrived.set(documentName, since < MEASURE_EVERY_BYTES ? since : 0);
      if (since < MEASURE_EVERY_BYTES || Y.encodeStateAsUpdate(document).byteLength <= LIVE_STATE_MAX_BYTES) return;
      console.warn(`[notes] ${documentName} grew past the live limit; its editors were closed`);
      for (const connection of document.getConnections()) connection.close();
    },

    async onDisconnect({ documentName, clientsCount }) {
      if (clientsCount === 0) arrived.delete(documentName);
    },

    async onLoadDocument({ documentName, document }) {
      const target = readDocumentName(documentName);
      if (!target) throw new Error("Not found");
      if (target.kind === "pages") return document;
      const { state, body } = await loadPageState(target.pageId);
      if (state) Y.applyUpdate(document, state);
      else {
        seedPageYjs(document, parsePageBody(body));
        stampEpoch(document, crypto.randomUUID());
      }
      return document;
    },

    async onStoreDocument({ documentName, document, lastContext }) {
      const target = readDocumentName(documentName);
      if (target?.kind !== "page" || !lastContext?.userId) return;
      const body = serialisePage(readPageYjs(document));
      await storePageState(target.tripId, target.pageId, lastContext.userId, Y.encodeStateAsUpdate(document), body);
    },
  });

  const closeWhere = (keep: (name: string) => boolean, userId?: string) => {
    for (const document of live.documents.values()) {
      if (keep(document.name)) continue;
      for (const connection of document.getConnections()) {
        if (userId === undefined || connection.context?.userId === userId) connection.close();
      }
    }
  };

  const stopKicks = onNotesKick((tripId, userId) => {
    closeWhere((name) => tripId !== null && readDocumentName(name)?.tripId !== tripId, userId);
  });
  const stopPings = onPagesChanged(({ tripId, closed }) => {
    live.documents.get(pagesDocumentName(tripId))?.broadcastStateless(PAGES_CHANGED);
    const gone = new Set(closed.map((pageId) => pageDocumentName(tripId, pageId)));
    closeWhere((name) => !gone.has(name));
  });
  live.configure({ extensions: [{ async onDestroy() { stopKicks(); stopPings(); } }] });

  return live;
}
