import { cx } from "@/components/system/ui";

export function PackingLane({
  name,
  count,
  packed,
  avatar,
  open,
  children,
  add,
}: {
  name: string;
  count: number;
  packed?: number;
  avatar?: React.ReactNode;
  open?: boolean;
  children: React.ReactNode;
  add?: React.ReactNode;
}) {
  return (
    <section className={cx(
      "min-w-0 rounded-lg border bg-sheet",
      open ? "border-highlight-edge" : "border-rule",
    )}>
      <header className={cx(
        "flex min-w-0 items-center gap-2 rounded-t-lg border-b border-dotted px-4 py-3",
        open ? "border-highlight-edge bg-highlight-soft" : "border-rule-strong",
      )}>
        {avatar ?? (open ? <span aria-hidden="true" className="size-2 rounded-full bg-highlight-ink" /> : null)}
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</h3>
        <span className="nums text-[11px] text-ink-faint">
          {packed === undefined ? count : count ? `${packed}/${count}` : "—"}
        </span>
      </header>
      <ul className="divide-y divide-rule">{children}</ul>
      {count === 0 && !add ? <p className="px-4 py-4 text-sm text-ink-faint">Nothing yet</p> : null}
      {add ? <div className={count > 0 ? "border-t border-rule p-3" : "p-3"}>{add}</div> : null}
    </section>
  );
}
