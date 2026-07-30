"use client";

/*
 * The event-category key on Days, turned from a legend into a filter (ticket
 * 90). Clicking a category toggles it; nothing toggled means everything shows,
 * which is what the key did before it could be clicked.
 *
 * The state lives in a context rather than in the page because the page is a
 * Server Component — the day cards and their event rows are rendered on the
 * server and handed down as `node`s, so the only client code that can act on
 * the filter is the one component every event already passes through,
 * `EventDragList`. It reads this context and hides the rows that don't match.
 *
 * Filtering is view-only: nothing is persisted and no action runs, so a reload
 * comes back to the unfiltered day.
 */

import { createContext, useContext, useState, type ReactNode } from "react";

import { cx } from "@/components/ui";
import { EVENT_CATEGORIES } from "@/lib/event-categories";
import type { DayEventType } from "@/db/schema";

/** `null` while no category is picked — the "show everything" case. */
const FilterContext = createContext<ReadonlySet<DayEventType> | null>(null);

/** Which categories are showing, or `null` for all of them. */
export function useEventCategoryFilter() {
  return useContext(FilterContext);
}

export function EventCategoryFilter({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ReadonlySet<DayEventType>>(new Set());

  const toggle = (value: DayEventType) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (!next.delete(value)) next.add(value);
      return next;
    });

  return (
    <FilterContext.Provider value={active.size === 0 ? null : active}>
      <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(EVENT_CATEGORIES).map(([value, c]) => {
          const on = active.has(value as DayEventType);
          return (
            <button
              key={value}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(value as DayEventType)}
              className={cx(
                "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.06em]",
                c.row,
                /* The colour says which category; the tick and the ring say
                   whether it's on — status is never colour alone. */
                on ? "text-ink ring-1 ring-pen" : "text-ink-soft",
              )}
            >
              <span aria-hidden>{on ? "✓" : "+"}</span>
              {c.label}
            </button>
          );
        })}
        {active.size > 0 ? (
          <button
            type="button"
            onClick={() => setActive(new Set())}
            className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-soft underline underline-offset-2"
          >
            Show all
          </button>
        ) : null}
      </div>
      {children}
      </div>
    </FilterContext.Provider>
  );
}
