import { cx } from "@/components/system/ui";
import type { StageNote } from "@/lib/landing/pro-tour";

/** Pairs a note with its row, and carries that link alone once the lines hide. */
export function ProBadge({ note, className, onDark }: { note: StageNote; className?: string; onDark?: boolean }) {
  const skin = note.inPro ? "bg-pro-gold text-pro-2" : onDark ? "bg-paper text-ink" : "bg-ink text-paper";
  return (
    <i className={cx("grid shrink-0 place-items-center rounded-full font-mono font-semibold not-italic", skin, className)}>
      {note.n}
    </i>
  );
}
