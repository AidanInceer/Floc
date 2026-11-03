import Link from "next/link";

import type { GapKind } from "@floc/core/trip/overview/left-to-sort";
import { NavGlyph } from "@/components/system/icons/nav";
import { BedIcon, EventGlyph } from "@/components/system/icons/days";
import { StarIcon } from "@/components/system/icons/explore-trip";
import { CheckIcon } from "@/components/system/icons";
import { cx } from "@/components/system/ui";

const GLYPH: Record<GapKind, React.ReactNode> = {
  days: <NavGlyph name="dates" />,
  ideas: <StarIcon size={13} />,
  money: <NavGlyph name="money" />,
  packing: <NavGlyph name="packing" />,
  stay: <BedIcon size={13} />,
  travel: <EventGlyph type="transport" transportType={null} size={13} />,
};

type Item = { kind: GapKind; text: string; sub?: string[] };

/** Columns every card in the stack shares, so dates and nights start at the same x on every card. */
export const STACK_COLUMNS = "grid gap-1.5 sm:grid-cols-[28px_max-content_max-content_max-content_1fr_auto] sm:gap-x-3.5";

/** One thing in the opened stack: what it is, its dates, and the way to sort it, or "Sorted". */
export function SortCard({ item, href, action }: { item: Item; href?: string; action?: string }) {
  const done = !href;
  return (
    <li className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-0.5 rounded-md bg-sheet px-3.5 py-2.5 text-sm ring-1 ring-rule sm:col-span-full sm:grid-cols-subgrid">
      <span
        className={cx(
          "grid size-7 place-items-center rounded-sm max-sm:row-span-2",
          done ? "bg-pastel-blue text-pen-deep" : "bg-sheet-2 text-ink-soft",
        )}
      >
        {done ? <CheckIcon size={12} /> : GLYPH[item.kind]}
      </span>
      <span className={cx("min-w-0", done && "text-ink-faint")}>{item.text}</span>
      {item.sub?.length ? (
        <span className="flex flex-wrap gap-x-3.5 font-mono text-xs text-ink-faint max-sm:col-start-2 max-sm:row-start-2 sm:contents">
          {item.sub.map((part) => (
            <span key={part} className="nums whitespace-nowrap">
              {part}
            </span>
          ))}
        </span>
      ) : null}
      {done ? (
        <span className="text-xs text-ink-faint max-sm:col-start-3 max-sm:row-start-1 sm:col-start-6">Sorted</span>
      ) : (
        <Link href={href} className="whitespace-nowrap text-ink-soft underline-offset-4 hover:text-ink hover:underline max-sm:col-start-3 max-sm:row-start-1 sm:col-start-6">
          {action}
        </Link>
      )}
    </li>
  );
}
