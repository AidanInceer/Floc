import type { ReactNode } from "react";

import { cx } from "@/components/system/ui";

/** The page's own title, as each tab opens with one. */
export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h4 className="font-display text-[26px] font-semibold leading-none tracking-[-0.02em]">{title}</h4>
        {sub ? <p className="nums mt-1.5 text-[11px] text-ink-soft">{sub}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function FakeButton({ children, small, quiet }: { children: ReactNode; small?: boolean; quiet?: boolean }) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-sm font-mono uppercase tracking-[0.06em]",
        quiet ? "border border-rule-strong bg-sheet text-ink" : "bg-pen text-sheet",
        small ? "px-2.5 py-[3px] text-[10px]" : "px-3.5 py-[7px] text-[11px]",
      )}
    >
      {children}
    </span>
  );
}
