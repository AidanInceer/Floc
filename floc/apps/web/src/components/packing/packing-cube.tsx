import { cx } from "@/components/system/ui";

export function PackingCube({
  heading,
  total,
  packed,
  children,
  add,
}: {
  heading: string;
  total: number;
  packed?: number;
  children: React.ReactNode;
  add?: React.ReactNode;
}) {
  const full = packed !== undefined && total > 0 && packed === total;
  return (
    <section className={cx(
      "overflow-hidden rounded-lg border bg-sheet",
      full ? "border-green-edge bg-green-soft" : "border-rule",
    )}>
      <header className="flex items-baseline justify-between gap-2 border-b border-dotted border-rule-strong px-4 py-3">
        <h3 className="text-sm font-semibold">{heading}</h3>
        <span className={cx("nums text-[11px]", full ? "text-green" : "text-ink-faint")}>
          {packed === undefined
            ? `${total} ${total === 1 ? "thing" : "things"}`
            : full ? "All packed" : `${packed}/${total}`}
        </span>
      </header>
      <ul className="divide-y divide-rule">{children}</ul>
      {add ? <div className="border-t border-rule px-3 py-2">{add}</div> : null}
    </section>
  );
}
