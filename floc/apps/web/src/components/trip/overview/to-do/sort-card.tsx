import type { GapKind } from "@floc/core/trip/overview/to-do";
import { SORT_COLOURS } from "@floc/core/design/section-colours";
import { NavGlyph } from "@/components/system/icons/nav";
import { BedIcon, EventGlyph } from "@/components/system/icons/days";
import { StarIcon } from "@/components/system/icons/explore-trip";
import { CheckIcon } from "@/components/system/icons";
import { ButtonLink, cx } from "@/components/system/ui";

const GLYPH: Record<GapKind, React.ReactNode> = {
  days: <NavGlyph name="dates" />,
  ideas: <StarIcon size={13} />,
  money: <NavGlyph name="money" />,
  packing: <NavGlyph name="packing" />,
  plan: <NavGlyph name="days" />,
  stay: <BedIcon size={13} />,
  travel: <EventGlyph type="transport" transportType={null} size={13} />,
};

type Item = { kind: GapKind; text: string; sub?: string[] };

export const STACK_COLUMNS = "grid gap-1.5 sm:grid-cols-[42px_max-content_max-content_max-content_1fr_auto] sm:gap-x-3.5";

export function SortCard({ item, href, action }: { item: Item; href?: string; action?: string }) {
  const done = !href;
  return (
    <li className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-0.5 rounded-md bg-sheet px-3.5 py-2.5 text-sm ring-1 ring-rule sm:col-span-full sm:grid-cols-subgrid">
      <SortTile kind={item.kind} done={done} />
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
        <span className="text-xs text-ink-faint max-sm:col-start-3 max-sm:row-start-1 sm:col-start-6">Done</span>
      ) : (
        <ButtonLink href={href} variant="secondary" className="whitespace-nowrap max-sm:col-start-3 max-sm:row-start-1 sm:col-start-6">
          {action}
        </ButtonLink>
      )}
    </li>
  );
}

export function SortTile({ kind, done = false }: { kind: GapKind; done?: boolean }) {
  const colour = SORT_COLOURS[kind];
  return (
    <span
      className="grid size-7 place-items-center rounded-sm max-sm:row-span-2"
      style={{ backgroundColor: `var(--pastel-${colour})`, color: `var(--pastel-${colour}-ink)` }}
    >
      {done ? <CheckIcon size={12} /> : GLYPH[kind]}
    </span>
  );
}
