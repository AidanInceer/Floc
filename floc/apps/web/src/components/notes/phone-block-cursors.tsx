"use client";

import type { BlockNoteEditor } from "@blocknote/core";
import type { PresentBlockCursor } from "@floc/core/notes/live/live-presence";
import { useEffect, useRef, useState } from "react";

import { initials } from "@/components/system/ui";

type Placed = { blockId: string; top: number; left: number; height: number; people: PresentBlockCursor[] };

function endOfText(block: HTMLElement): DOMRect | null {
  const inline = block.querySelector<HTMLElement>(":scope > .bn-block-content .bn-inline-content");
  if (!inline) return null;
  const range = document.createRange();
  range.selectNodeContents(inline);
  const rects = range.getClientRects();
  return rects.length > 0 ? rects[rects.length - 1] : inline.getBoundingClientRect();
}

// Why: labels drawn inside the editable DOM are read back by ProseMirror as typed text.
export function PhoneBlockCursors({
  editor,
  people,
}: {
  editor: BlockNoteEditor;
  people: PresentBlockCursor[];
}) {
  const layer = useRef<HTMLDivElement>(null);
  const [placed, setPlaced] = useState<Placed[]>([]);

  useEffect(() => {
    const place = () => {
      const root = editor.domElement;
      const origin = layer.current?.getBoundingClientRect();
      if (!root || !origin) return setPlaced([]);
      const next: Placed[] = [];
      for (const block of root.querySelectorAll<HTMLElement>(".bn-block[data-id]")) {
        const here = people.filter((person) => person.blockId === block.dataset.id);
        if (here.length === 0) continue;
        const end = endOfText(block);
        if (!end) continue;
        const left = (end.width === 0 ? end.left : end.right) - origin.left;
        next.push({ blockId: block.dataset.id!, top: end.top - origin.top, left, height: end.height, people: here });
      }
      setPlaced(next);
    };
    place();
    const offMount = editor.onMount(place);
    const offChange = editor.onChange(place, true);
    window.addEventListener("resize", place);
    return () => {
      offMount();
      offChange();
      window.removeEventListener("resize", place);
    };
  }, [editor, people]);

  return (
    <div ref={layer} className="floc-phone-block-layer" aria-hidden={placed.length === 0}>
      {placed.map((row) => (
        <span key={row.blockId} className="floc-phone-block-cursors" style={{ top: row.top, left: row.left, height: row.height }}>
          {row.people.map((person) => (
            <span
              key={person.id}
              className={`floc-phone-block-cursor ${person.tone}`}
              aria-label={`${person.name} is editing this block from the app`}
            >
              {initials(person.name)}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}
