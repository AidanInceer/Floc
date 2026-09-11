/**
 * The trip's Notes document (ticket 238) — a BlockNote editor over one JSON
 * blob.
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
  type Block,
} from "@blocknote/core";
import { BlockNoteView } from "@blocknote/ariakit";
import { useCreateBlockNote } from "@blocknote/react";

import { saveNotes } from "@/app/trip/[id]/notes/actions";

const schema = BlockNoteSchema.create({ blockSpecs: defaultBlockSpecs });

const SAVE_AFTER_MS = 900;

const STARTING_DOC = [{ type: "paragraph" }] as const;

type SaveState = "idle" | "saving" | "saved" | "failed";

/** Block types this build can render — anything else came from a newer one. */
const KNOWN_BLOCK_TYPES = new Set(Object.keys(schema.blockSchema));

export function NotesEditor({
  tripId,
  initialDoc,
}: {
  tripId: number;
  initialDoc: string | null;
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
    placeholders: { emptyDocument: "Write the first note" },
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
    <>
      <BlockNoteView
        editor={editor}
        // No `theme` prop: the palette is set in globals.css off the house
        // tokens, so it follows `data-theme` with nothing to hydrate. Naming a
        // theme here would only pin the few styles the tokens do not cover.
        onChange={queueSave}
      />
      <p className="typed mt-4 text-right" aria-live="polite">
        {saveState === "saving"
          ? "Saving"
          : saveState === "saved"
            ? "Saved"
            : saveState === "failed"
              ? "Not saved — still trying"
              : ""}
      </p>
    </>
  );
}

/**
 * A stored doc this build cannot render must not take the tab down with it.
 * BlockNote throws while constructing the editor on a block type it does not
 * know, and that is a render no error boundary of ours is under — so unknown
 * blocks are dropped here rather than caught later. This is also what retires
 * the old `ideasBoard` block: docs still holding one simply lose it on load.
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
