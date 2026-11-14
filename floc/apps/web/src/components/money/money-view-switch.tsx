import Link from "next/link";

import { cx, segmentTrack } from "@/components/system/ui";

export type MoneyView = "expenses" | "budget";

/** Expenses or your own Budget (#574): one switch, so Money stays one tab. */
export function MoneyViewSwitch({ tripId, view }: { tripId: number; view: MoneyView }) {
  const item = (key: MoneyView, label: string, href: string) => (
    <Link
      href={href}
      scroll={false}
      aria-current={view === key ? "page" : undefined}
      className={cx(
        "flex h-[23px] items-center rounded-sm px-3 text-[13px] transition-colors hover:bg-pen-soft",
        view === key ? "bg-pen-soft text-pen-deep" : "text-ink-soft hover:text-pen-deep",
      )}
    >
      {label}
    </Link>
  );
  return (
    <nav aria-label="Money view" className={cx("inline-flex gap-1", segmentTrack)}>
      {item("expenses", "Expenses", `/trip/${tripId}/money`)}
      {item("budget", "Budget", `/trip/${tripId}/money?view=budget`)}
    </nav>
  );
}
