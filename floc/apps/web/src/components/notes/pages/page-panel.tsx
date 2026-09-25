/** The open notes page (#408): where it sits, who is on it, whether it is live, then the page itself. */
"use client";

import type { HocuspocusProviderWebsocket } from "@hocuspocus/provider";
import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import { PageEditor } from "@floc/editor/view/page-editor";
import { PageTop } from "@floc/editor/view/page-top";
import type { PageThread } from "@floc/editor/view/comments";
import { LIVE_STATUS_WORDS } from "@floc/core/notes/live/live-status";
import type { PageIcon } from "@floc/core/notes/pages/page-icons";
import { LINK_TABS, type LinkKind, type TripLinkItem } from "@floc/core/notes/pages/trip-links";

import { replyPageThread, resolvePageThread, startPageThread } from "@/app/trip/[id]/notes/actions";
import { AvatarRow } from "@/components/system/ui";
import { useLivePage } from "./use-live-notes";

type OpenPage = { id: number; title: string; icon: PageIcon | null };

export function PagePanel({ tripId, page, parent, socket, epoch, viewer, links, threads, onRename, onIcon, onOpen }: {
  tripId: number;
  page: OpenPage;
  parent: OpenPage | null;
  socket: HocuspocusProviderWebsocket | null;
  epoch: string | null;
  viewer: { id: string; name: string };
  links: TripLinkItem[];
  threads: PageThread[];
  onRename: (title: string) => void;
  onIcon: (icon: PageIcon | null) => void;
  onOpen: (id: number) => void;
}) {
  const router = useRouter();
  const live = useLivePage(socket, tripId, page.id, epoch);
  const handle = useRef<{ focusStart: () => void } | null>(null);
  const openLink = useCallback((kind: LinkKind) => router.push(`/trip/${tripId}/${LINK_TABS[kind]}`), [router, tripId]);

  return (
    <section className="notes-page" aria-label={page.title || "Untitled"}>
      <div className="notes-top">
        <p className="notes-crumbs">
          {parent ? (
            <>
              <button type="button" onClick={() => onOpen(parent.id)}>{parent.title || "Untitled"}</button>
              {" / "}
              {page.title || "Untitled"}
            </>
          ) : null}
        </p>
        <div className="notes-live">
          <AvatarRow people={live?.people ?? []} size={24} />
          <span className="typed" aria-live="polite">{LIVE_STATUS_WORDS[live?.status ?? "saving"]}</span>
        </div>
      </div>
      <div className="notes-sheet">
        <PageTop title={page.title} icon={page.icon} onRename={onRename} onIcon={onIcon} onDown={() => handle.current?.focusStart()} />
        {live ? (
          <PageEditor
            doc={live.doc}
            awareness={live.provider.awareness}
            me={viewer}
            foldKey={`${tripId}:${page.id}`}
            links={links}
            threads={threads}
            handle={handle}
            onOpenLink={openLink}
            onStartThread={(body) => startPageThread(tripId, page.id, body)}
            onReply={(threadId, body) => replyPageThread(tripId, page.id, threadId, body)}
            onResolve={(threadId) => resolvePageThread(tripId, threadId)}
          />
        ) : (
          <p className="typed text-ink-faint">Opening the page</p>
        )}
      </div>
    </section>
  );
}
