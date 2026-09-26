export function PackingCount({
  total,
  packed,
}: {
  total: number;
  packed: number;
}) {
  if (total === 0) return null;
  return (
    <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-faint">
      {total === 1 ? "1 thing" : `${total} things`}
      {packed > 0 ? ` · ${packed} packed` : null}
    </span>
  );
}

export function SegmentedField({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center rounded-full border border-rule-strong bg-sheet p-0.5">
      {children}
    </div>
  );
}

export const segmentOn = "bg-pen text-sheet";
export const segmentOff = "text-ink-soft hover:bg-sheet-2 hover:text-ink";
// `focus-within` because a segment is sometimes a label wrapping an `sr-only`
// radio (ticket 239) — the ring has to land on the shape, not on the hidden
// input, or tabbing into the control shows nothing at all.
export const segmentShape =
  "rounded-full px-2 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em] transition-colors sm:px-3 focus-within:outline focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-pen";
