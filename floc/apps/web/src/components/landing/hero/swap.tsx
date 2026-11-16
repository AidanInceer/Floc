import type { ReactNode } from "react";

import { cx } from "@/components/system/ui";
import "./hero.css";

export function Swap({ on, from, to, className }: { on: boolean; from: ReactNode; to: ReactNode; className?: string }) {
  return (
    <span className={cx("deck-swap", on && "is-on", className)}>
      <span aria-hidden={on}>{from}</span>
      <span aria-hidden={!on}>{to}</span>
    </span>
  );
}

export function Roll({ value, children }: { value: string | number; children?: ReactNode }) {
  return (
    <span key={value} className="deck-roll">
      {children ?? value}
    </span>
  );
}
