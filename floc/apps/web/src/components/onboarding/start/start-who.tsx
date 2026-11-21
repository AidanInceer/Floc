"use client";

import { TRIP_INVITE_CAP } from "@floc/core/people/group-ticks";

import { Avatar, cx } from "@/components/system/ui";

export type StartPerson = { id: string; name: string };

const firstName = (name: string) => name.split(" ")[0] || name;

export function StartWho({ me, people, picked, onToggle }: {
  me: string;
  people: StartPerson[];
  picked: string[];
  onToggle: (id: string) => void;
}) {
  const full = picked.length >= TRIP_INVITE_CAP;
  return (
    <div className="grid justify-items-center gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        <span className="grid justify-items-center gap-1.5 p-2 text-sm text-ink">
          <Avatar name={me} size={44} title={`${me} (you)`} />
          You
        </span>
        {people.map((person) => {
          const on = picked.includes(person.id);
          return (
            <button
              key={person.id}
              type="button"
              aria-pressed={on}
              disabled={!on && full}
              onClick={() => onToggle(person.id)}
              className={cx(
                "grid justify-items-center gap-1.5 rounded-sm p-2 text-sm transition-colors duration-220 ease-(--ease) hover:bg-pen-soft disabled:pointer-events-none",
                on ? "text-ink ring-[1.5px] ring-pen/60" : "text-ink-soft [&_[aria-label]]:opacity-50",
              )}
            >
              <Avatar name={person.name} size={44} />
              {firstName(person.name)}
            </button>
          );
        })}
      </div>
      {full ? <p className="text-center text-sm text-ink-soft">You can ask up to {TRIP_INVITE_CAP} at once.</p> : null}
    </div>
  );
}
