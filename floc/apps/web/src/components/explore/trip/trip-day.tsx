import { activityKind } from "@floc/core/trip/explore/detail/activity-kind";
import type { PlanDay } from "@floc/core/trip/explore/detail/preset-plan";

import { ActivityGlyph, ActivityTile } from "@/components/explore/trip/activity-tile";
import { StarIcon } from "@/components/explore/trip/trip-glyphs";
import { ChevronIcon } from "@/components/system/icons";
import { cx } from "@/components/system/ui";

function Summary({ day }: { day: PlanDay }) {
  if (day.highlight) {
    return (
      <span className="flex items-center gap-1.5 text-[12.5px] text-highlight-ink">
        <StarIcon className="fill-current" />
        {day.highlight}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-ink-faint">
      {day.items.map((item) => (
        <ActivityGlyph key={`${item.time}-${item.text}`} kind={activityKind(item)} />
      ))}
      <span className="ml-1">
        {day.items.length} {day.items.length === 1 ? "plan" : "plans"}
      </span>
    </span>
  );
}

function DayRail({ day }: { day: PlanDay }) {
  return (
    <ol className="relative grid pb-4 pl-2 pr-4 before:absolute before:bottom-[35px] before:left-[calc(0.5rem+44px+12px+12px)] before:top-[19px] before:w-0.5 before:rounded-full before:bg-rule-strong sm:pl-[58px] sm:before:left-[calc(58px+44px+12px+12px)]">
      {day.items.map((item) => (
        <li
          key={`${item.time}-${item.text}`}
          className={cx(
            "grid grid-cols-[44px_26px_minmax(0,1fr)] items-center gap-3 py-1.5 text-sm",
            item.highlight && "-mx-2.5 my-0.5 rounded-sm bg-highlight-soft px-2.5 py-2 shadow-[inset_0_0_0_1px_var(--color-highlight-edge)]",
          )}
        >
          <span className="nums text-right text-xs text-ink-faint">{item.time}</span>
          <ActivityTile kind={activityKind(item)} highlight={item.highlight} />
          <span className={cx(item.highlight && "font-semibold", item.free && "italic text-green")}>
            {item.text}
            {item.highlight ? (
              <span className="typed ml-2 inline-flex items-center gap-1 align-[1px] text-[10px] font-normal text-highlight-ink">
                <StarIcon size={10} className="fill-current" />
                Highlight
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function DayRow({ day, open, onToggle }: { day: PlanDay; open: boolean; onToggle: () => void }) {
  const span = day.items.length ? `${day.items[0].time} to ${day.items[day.items.length - 1].time}` : "";
  return (
    <li
      id={`day-${day.n}`}
      className={cx(
        "scroll-mt-24 rounded-md border",
        open ? "border-rule-strong bg-sheet shadow-raised" : day.highlight ? "border-highlight-edge bg-highlight-soft" : "border-rule bg-paper",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`day-${day.n}-plan`}
        className="grid w-full grid-cols-[36px_minmax(0,1fr)_14px] items-center gap-3 py-2.5 pl-2.5 pr-3.5 text-left sm:grid-cols-[36px_minmax(0,1fr)_auto_14px]"
      >
        <span
          className={cx(
            "nums grid size-9 place-content-center rounded-sm text-center text-sm leading-none",
            open ? "bg-ink text-sheet" : "bg-sheet-2 text-ink-soft",
          )}
        >
          <span className="mb-0.5 text-[8px] uppercase tracking-[0.08em]">Day</span>
          {day.n}
        </span>
        <span className="grid gap-[3px]">
          <span className="font-semibold">{day.title}</span>
          <Summary day={day} />
        </span>
        <span className="nums hidden text-xs text-ink-faint sm:block">{span}</span>
        <ChevronIcon direction={open ? "up" : "down"} size={14} className="text-ink-faint" />
      </button>
      {open ? (
        <div id={`day-${day.n}-plan`}>
          <DayRail day={day} />
        </div>
      ) : null}
    </li>
  );
}
