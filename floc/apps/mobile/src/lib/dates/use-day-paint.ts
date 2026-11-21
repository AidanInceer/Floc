import { paintDiff, type PaintMark, type PaintMode } from "@floc/core/dates/finding/day-paint";
import { useRef, useState } from "react";

import { beginDrag, extendDrag, fillDays, type Drag, type Edits } from "./paint-edits";

export function useDayPaint() {
  const [edits, setEdits] = useState<Edits>({});
  const [mode, setMode] = useState<PaintMode>("free");
  const drag = useRef<Drag | null>(null);

  return {
    edits,
    mode,
    setMode,
    press(anchor: string, target: string, markOf: (date: string) => PaintMark) {
      if (drag.current === null) {
        const began = beginDrag(edits, anchor, markOf, mode);
        drag.current = began.drag;
        setEdits(began.edits);
        return;
      }
      setEdits(extendDrag(drag.current, target));
    },
    release() {
      drag.current = null;
    },
    fill(markOf: (date: string) => PaintMark, dates: string[]) {
      setEdits(fillDays(edits, markOf, dates));
    },
    clear() {
      setEdits({});
    },
    diff: (stored: (date: string) => PaintMark) => paintDiff(stored, edits),
  };
}
