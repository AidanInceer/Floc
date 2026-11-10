"use client";

import { GROUP_CAP, TRIP_INVITE_CAP } from "@floc/core/people/group-ticks";

import { Avatar, cx } from "@/components/system/ui";
import type { Person } from "@/server/social/friends";

const TILE =
  "flex min-h-11 w-full items-center gap-2 rounded-sm border border-rule bg-sheet px-2.5 py-1.5 text-left text-sm transition-colors hover:border-pen aria-pressed:border-pen aria-pressed:bg-pen-soft aria-pressed:text-pen-deep disabled:cursor-default disabled:opacity-50 disabled:hover:border-rule focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pen";

export function GroupPeoplePicker({
  people,
  ticked,
  onToggle,
  isFriend,
  tripPicker,
}: {
  people: Person[];
  ticked: ReadonlySet<string>;
  onToggle: (id: string) => void;
  isFriend: (id: string) => boolean;
  tripPicker?: boolean;
}) {
  const full = ticked.size >= (tripPicker ? TRIP_INVITE_CAP : GROUP_CAP);
  if (people.length === 0) return <p className="text-sm text-ink-soft">No friends yet.</p>;
  return (
    <ul className={cx("grid gap-1.5", !tripPicker && "grid-cols-2 sm:grid-cols-3")}>
      {people.map((person) => {
        const on = ticked.has(person.id);
        return (
          <li key={person.id} className="min-w-0">
            <button
              type="button"
              aria-pressed={on}
              disabled={!on && full}
              onClick={() => onToggle(person.id)}
              className={cx(TILE, "h-full")}
            >
              <Avatar name={person.name} size={24} />
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="[overflow-wrap:anywhere]">{person.name}</span>
                {isFriend(person.id) ? null : (
                  <span className="text-xs text-ink-soft">Not a friend</span>
                )}
              </span>
              <TickMark on={on} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function TickMark({ on }: { on: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 14 14"
      width={13}
      height={13}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cx("shrink-0", on ? "text-pen-deep" : "text-ink-faint")}
    >
      <path d={on ? "M3 7.5l2.5 2.5L11 4.5" : "M7 3v8M3 7h8"} />
    </svg>
  );
}

export function peopleWithTicked(friends: Person[], ticked: ReadonlySet<string>, known: Map<string, Person>): Person[] {
  const listed = new Set(friends.map((f) => f.id));
  const extra = [...ticked].filter((id) => !listed.has(id)).map((id) => known.get(id)).filter((p): p is Person => !!p);
  return [...friends, ...extra];
}
