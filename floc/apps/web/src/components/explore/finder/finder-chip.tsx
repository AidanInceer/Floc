import type { ReactNode } from "react";

import { cx } from "@/components/system/ui";

/** A pressable chip in the rail. `count` is how many listings it would give; at 0 the chip goes dashed but stays pressable. */
export function FinderChip({
  on,
  count,
  small = false,
  onClick,
  children,
}: {
  on: boolean;
  count?: number;
  small?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border transition-colors",
        small ? "min-h-7 px-2.5 text-xs" : "min-h-8 px-3 text-[13px]",
        on ? "border-ink bg-ink text-paper" : "border-rule-strong bg-sheet text-ink hover:border-ink-faint",
        !on && count === 0 && "border-dashed text-ink-faint",
      )}
    >
      {children}
      {count === undefined ? null : <span className={cx("nums text-[11px]", on ? "opacity-70" : "text-ink-faint")}>{count}</span>}
    </button>
  );
}

export const linkClass = "inline-flex items-center gap-1 whitespace-nowrap text-[12.5px] text-ink-soft underline decoration-rule-strong underline-offset-[3px] hover:text-ink";
