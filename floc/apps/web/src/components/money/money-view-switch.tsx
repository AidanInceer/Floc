import Link from "next/link";

import { SegmentTrack } from "@/components/system/segment-track";
import { cx, trackSegmentClass } from "@/components/system/ui";

export type MoneyView = "expenses" | "budget";

export function MoneyViewSwitch({ tripId, view }: { tripId: number; view: MoneyView }) {
  const item = (key: MoneyView, label: string, href: string) => (
    <Link
      href={href}
      scroll={false}
      aria-current={view === key ? "page" : undefined}
      className={cx(trackSegmentClass(view === key), "flex h-[23px] items-center px-3 text-[13px]")}
    >
      {label}
    </Link>
  );
  return (
    <SegmentTrack as="nav" aria-label="Money view" className="inline-flex gap-1">
      {item("expenses", "Expenses", `/trip/${tripId}/money`)}
      {item("budget", "Budget", `/trip/${tripId}/money?view=budget`)}
    </SegmentTrack>
  );
}
