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

