/**
 * The Notes tab (#408): one card, the page list on the left (it folds away)
 * and the open page on the right. The open page is in the address, so a link
 * to a page opens that page.
 */
"use client";

import "@floc/editor/editor.css";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { Icon } from "@floc/editor/view/icons";
import type { PageThread } from "@floc/editor/view/comments";
import type { PageIcon } from "@floc/core/notes/pages/page-icons";
import type { TripLinkItem } from "@floc/core/notes/pages/trip-links";

import {
  archivePageAction,
  movePageAction,
  newPage,
  renamePageAction,
  restorePageAction,
  setPageIconAction,
} from "@/app/trip/[id]/notes/actions";
import { PagePanel } from "./page-panel";
import { PageRail, type RailActions, type RailArchived, type RailPage } from "./page-rail";
import { useNotesSocket, usePageList } from "./use-live-notes";

export function NotesWorkspace({ tripId, pages, archived, openId, epoch, viewer, links, threads, now }: {
  tripId: number;
  pages: RailPage[];
  archived: RailArchived[];
  openId: number;
  epoch: string | null;
  viewer: { id: string; name: string };
  links: TripLinkItem[];
  threads: PageThread[];
  now: string;
}) {
  const router = useRouter();
  const socket = useNotesSocket();
  const byPage = usePageList(socket, tripId, openId, viewer);
  const [shut, setShut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  const page = pages.find((p) => p.id === openId) ?? pages[0];
  const parent = page.parentId === null ? null : pages.find((p) => p.id === page.parentId) ?? null;

  const open = useCallback((id: number) => router.push(`/trip/${tripId}/notes?page=${id}`, { scroll: false }), [router, tripId]);
  const act = useCallback((work: () => Promise<string | null | void>) => {
    setError(null);
    start(async () => {
      const refused = await work();
      if (typeof refused === "string") setError(refused);
    });
  }, []);

  const actions: RailActions = useMemo(() => ({
    open,
    add: (parentId) => act(async () => {
      const made = await newPage(tripId, parentId);
      if ("error" in made) return made.error;
      open(made.id);
    }),
    rename: (id, title) => act(() => renamePageAction(tripId, id, title)),
    icon: (id, icon) => act(() => setPageIconAction(tripId, id, icon)),
    move: (id, target, after) => act(() => {
      const moving = pages.find((p) => p.id === id);
      const siblings = pages.filter((p) => p.parentId === moving?.parentId && p.id !== id);
      const at = siblings.findIndex((p) => p.id === target) + (after ? 1 : 0);
      return movePageAction(tripId, id, siblings[at]?.id ?? null);
    }),
    archive: (id) => act(async () => {
      const refused = await archivePageAction(tripId, id);
      if (!refused && (id === openId || page.parentId === id)) open(pages.find((p) => p.id !== id && p.parentId !== id)?.id ?? openId);
      return refused;
    }),
    restore: (id) => act(() => restorePageAction(tripId, id)),
  }), [act, open, pages, tripId, openId, page.parentId]);

  const rename = useCallback((title: string) => actions.rename(page.id, title), [actions, page.id]);
  const icon = useCallback((next: PageIcon | null) => actions.icon(page.id, next), [actions, page.id]);

  return (
    <div className="notes-card">
      <aside className={shut ? "notes-rail is-shut" : "notes-rail"} aria-label="Pages">
        {shut ? (
          <button type="button" className="notes-tool" aria-label="Show pages" title="Show pages" onClick={() => setShut(false)}><Icon name="rail" /></button>
        ) : (
          <>
            <div className="notes-rail-head">
              <span className="typed">Pages</span>
              <button type="button" className="notes-tool" aria-label="Hide pages" title="Hide pages" onClick={() => setShut(true)}><Icon name="rail" /></button>
            </div>
            <PageRail pages={pages} archived={archived} openId={page.id} byPage={byPage} actions={actions} now={new Date(now)} error={error} />
          </>
        )}
      </aside>
      <PagePanel
        key={page.id}
        tripId={tripId}
        page={page}
        parent={parent}
        socket={socket}
        epoch={epoch}
        viewer={viewer}
        links={links}
        threads={threads}
        onRename={rename}
        onIcon={icon}
        onOpen={open}
      />
    </div>
  );
}
