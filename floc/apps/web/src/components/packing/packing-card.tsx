import { thingCount } from "@floc/core/packing/packing-words";

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
      {thingCount(total)}
      {packed > 0 ? ` · ${packed} packed` : null}
    </span>
  );
}

