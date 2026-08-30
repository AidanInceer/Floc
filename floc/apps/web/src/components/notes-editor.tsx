/**
 * The trip's Notes document (ticket 238) — a BlockNote editor over one JSON
 * blob, with the voting board as a custom block.
 *
 * Autosave rather than a Save button: the doc is the group's shared page, and
 * a button is one more thing to forget. Last-write-wins (rule 7) — two people
 * typing at once is a known gap, tracked separately.
 */
"use client";

import "@blocknote/ariakit/style.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BlockNoteSchema,
  defaultBlockSpecs,
  filterSuggestionItems,
  type Block,
} from "@blocknote/core";
import { BlockNoteView } from "@blocknote/ariakit";
import {
  createReactBlockSpec,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";

import {
  IdeasBlockBody,
  IdeasBlockProvider,
  type IdeasBlockData,
} from "@/components/ideas-block";
import { saveNotes } from "@/app/trip/[id]/notes/actions";

/** The board is a single indivisible block — nothing types inside it. */
const ideasBoardSpec = createReactBlockSpec(
  { type: "ideasBoard", propSchema: {}, content: "none" },
  { render: () => <IdeasBlockBody /> },
);

const schema = BlockNoteSchema.create({
  blockSpecs: { ...defaultBlockSpecs, ideasBoard: ideasBoardSpec() },
});

const SAVE_AFTER_MS = 900;

/**
 * What an untouched trip opens on. The board is in it because every trip that
 * predates this doc already has ideas — an empty page would hide them.
 *
 * It can be deleted like any block, and then the ideas have no surface until
 * someone adds it back. That is deliberate: the block is where the board goes,
 * not what keeps it — the rows are untouched, and "/ideas" brings it back.
 */
const STARTING_DOC = [
  { type: "paragraph" },
  { type: "ideasBoard" },
  { type: "paragraph" },
] as const;

type SaveState = "idle" | "saving" | "saved" | "failed";

/** Block types this build can render — anything else came from a newer one. */
const KNOWN_BLOCK_TYPES = new Set(Object.keys(schema.blockSchema));

export function NotesEditor({
  tripId,
  initialDoc,
  board,
}: {
  tripId: number;
  initialDoc: string | null;
  board: IdeasBlockData;
}) {
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** The newest edit not yet written. Held so unmount can still send it. */
  const unsaved = useRef<string | null>(null);
  const mounted = useRef(true);

  const initialContent = useMemo(() => parseDoc(initialDoc), [initialDoc]);

  const editor = useCreateBlockNote({
    schema,
    initialContent: initialContent ?? [...STARTING_DOC],
  });

  const flush = useCallback(async () => {
    const body = unsaved.current;
    if (body === null) return;
    unsaved.current = null;
    try {
      await saveNotes(tripId, body);
      if (mounted.current) setSaveState("saved");
    } catch {
      // Put it back: the next keystroke, or leaving the page, tries again.
      unsaved.current = body;
      if (mounted.current) setSaveState("failed");
    }
  }, [tripId]);

  const queueSave = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    unsaved.current = JSON.stringify(editor.document);
    setSaveState("saving");
    timer.current = setTimeout(() => void flush(), SAVE_AFTER_MS);
  }, [editor, flush]);

  // Leaving inside the debounce window used to lose the edit silently — the
  // timer was cleared and never fired. Send it instead, on the way out and
  // whenever the tab is hidden, which is the last moment a phone gives you.
  useEffect(() => {
    mounted.current = true;
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      mounted.current = false;
      document.removeEventListener("visibilitychange", onHide);
      if (timer.current) clearTimeout(timer.current);
      void flush();
    };
  }, [flush]);

  return (
    <IdeasBlockProvider value={board}>
      <BlockNoteView
        editor={editor}
        // No `theme` prop: the palette is set in globals.css off the house
        // tokens, so it follows `data-theme` with nothing to hydrate. Naming a
        // theme here would only pin the few styles the tokens do not cover.
        slashMenu={false}
        onChange={queueSave}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) =>
            filterSuggestionItems(
              [
                ...getDefaultReactSlashMenuItems(editor),
                // One board per doc. A second copy is the same rows twice, and
                // whichever you voted in, both would move.
                ...(editor.document.some((b) => b.type === "ideasBoard")
                  ? []
                  : [
                      {
                        title: "Ideas board",
                        group: "Trip",
                        aliases: ["ideas", "vote", "voting"],
                        onItemClick: () =>
                          editor.insertBlocks(
                            [{ type: "ideasBoard" }],
                            editor.getTextCursorPosition().block,
                            "after",
                          ),
                      },
                    ]),
              ],
              query,
            )
          }
        />
      </BlockNoteView>
      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="typed">Type /ideas for the voting board</p>
        <p className="typed" aria-live="polite">
          {saveState === "saving"
            ? "Saving"
            : saveState === "saved"
              ? "Saved"
              : saveState === "failed"
                ? "Not saved — still trying"
                : ""}
        </p>
      </div>
    </IdeasBlockProvider>
  );
}

/**
 * A stored doc this build cannot render must not take the tab down with it.
 * BlockNote throws while constructing the editor on a block type it does not
 * know, and that is a render no error boundary of ours is under — so unknown
 * blocks are dropped here rather than caught later.
 */
function parseDoc(raw: string | null): Block[] | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  const blocks = parsed.filter(
    (b): b is Block =>
      typeof b === "object" &&
      b !== null &&
      "type" in b &&
      typeof b.type === "string" &&
      KNOWN_BLOCK_TYPES.has(b.type),
  );
  return blocks.length > 0 ? blocks : null;
}
