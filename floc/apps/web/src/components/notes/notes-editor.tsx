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

import { AvatarRow } from "@/components/system/ui";
import { NOTES_FRAGMENT } from "@floc/core/notes/live/live-names";
import { liveUser } from "@floc/core/notes/live/live-presence";
import { LIVE_STATUS_WORDS } from "@floc/core/notes/live/live-status";
import { useSiteTheme } from "@/lib/use-site-theme";
import { renderLiveCursor } from "./live-cursor";
import { PhoneBlockCursors } from "./phone-block-cursors";
import { useLiveNotes, type LiveNotes } from "./use-live-notes";
import { useLivePresence } from "./use-live-presence";

const schema = BlockNoteSchema.create({ blockSpecs: defaultBlockSpecs });

type Viewer = { id: string; name: string };

export function NotesEditor({
  tripId,
  epoch,
  viewer,
}: {
  tripId: number;
  epoch: string | null;
  viewer: Viewer;
}) {
  const live = useLiveNotes(tripId, epoch);
  if (!live) return <p className="typed">Opening the doc</p>;
  return <LiveEditor key={live.provider.document.guid} live={live} viewer={viewer} />;
}

function LiveEditor({ live, viewer }: { live: LiveNotes; viewer: Viewer }) {
  const editor = useCreateBlockNote(
    withCollaboration({
      schema,
      collaboration: {
        provider: { awareness: live.provider.awareness ?? undefined },
        fragment: live.doc.getXmlFragment(NOTES_FRAGMENT),
        user: liveUser(viewer),
        renderCursor: renderLiveCursor,
      },
      placeholders: { emptyDocument: "Write the first note" },
    }),
  );
  const theme = useSiteTheme();
  const presence = useLivePresence(live.provider, live.doc);

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <AvatarRow people={presence.people} size={24} />
        <p className="typed" aria-live="polite">
          {LIVE_STATUS_WORDS[live.status]}
        </p>
      </div>
      <div className="relative">
        <BlockNoteView
          editor={editor}
          // Why: left unset, BlockNote follows the device's dark setting and
          // paints the editor dark on a light site.
          theme={theme}
        />
        <PhoneBlockCursors editor={editor} people={presence.cursors} />
      </div>
    </>
  );
}
