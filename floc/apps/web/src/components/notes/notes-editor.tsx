/**
 * The trip's Notes document (ticket 238), edited live with the rest of the
 * trip through Yjs (#392). No save call: every keystroke is a Yjs update.
 */
"use client";

import "@blocknote/ariakit/style.css";

import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { withCollaboration } from "@blocknote/core/yjs";
import { BlockNoteView } from "@blocknote/ariakit";
import { useCreateBlockNote } from "@blocknote/react";

import { NOTES_FRAGMENT } from "@/lib/notes/live-names";
import type { LiveStatus } from "@/lib/notes/live-status";
import { useSiteTheme } from "@/lib/use-site-theme";
import { useLiveNotes, type LiveNotes } from "./use-live-notes";

const schema = BlockNoteSchema.create({ blockSpecs: defaultBlockSpecs });

const STATUS_WORDS: Record<LiveStatus, string> = {
  saved: "Saved",
  saving: "Saving",
  offline: "Offline — changes kept",
};

export function NotesEditor({
  tripId,
  epoch,
  viewerName,
}: {
  tripId: number;
  epoch: string | null;
  viewerName: string;
}) {
  const live = useLiveNotes(tripId, epoch);
  if (!live) return <p className="typed">Opening the doc</p>;
  return <LiveEditor key={live.provider.document.guid} live={live} viewerName={viewerName} />;
}

function LiveEditor({ live, viewerName }: { live: LiveNotes; viewerName: string }) {
  const editor = useCreateBlockNote(
    withCollaboration({
      schema,
      collaboration: {
        provider: { awareness: live.provider.awareness ?? undefined },
        fragment: live.doc.getXmlFragment(NOTES_FRAGMENT),
        user: { name: viewerName, color: "var(--pen)" },
      },
      placeholders: { emptyDocument: "Write the first note" },
    }),
  );
  const theme = useSiteTheme();

  return (
    <>
      <BlockNoteView
        editor={editor}
        // Why: left unset, BlockNote follows the device's dark setting and
        // paints the editor dark on a light site.
        theme={theme}
      />
      <p className="typed mt-4 text-right" aria-live="polite">
        {STATUS_WORDS[live.status]}
      </p>
    </>
  );
}
