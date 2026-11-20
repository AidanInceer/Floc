"use client";

import { useRef } from "react";

import { openFirst } from "@floc/core/trip/nudge/fit-count";
import type { NudgePerson, NudgeTask } from "@floc/core/trip/nudge/nudge";
import { Menu } from "@/components/system/client-ui";
import { CheckIcon } from "@/components/system/icons";
import { Avatar, busyMark, Button, cx, menuItemClass } from "@/components/system/ui";
import { NudgedMark, NudgeNote } from "./nudged-mark";
import { useFitCount } from "./use-fit-count";
import { useNudgePress } from "./use-nudge-press";

const chipClass =
  "inline-flex h-[31px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm border pl-1.5 pr-2.5 text-sm transition-colors";

function Chip({ person, busy, onPress }: { person: NudgePerson; busy: boolean; onPress?: () => void }) {
  const face = <Avatar name={person.name} size={20} />;
  if (person.nudged) {
    return (
      <span data-chip className={cx(chipClass, "border-transparent bg-sheet-2 text-ink-faint")}>
        {face}
        {person.name}
        <CheckIcon size={11} />
        <span className="sr-only">: nudged today</span>
      </span>
    );
  }
  return (
    <button
      type="button"
      data-chip
      disabled={busy}
      onClick={onPress}
      aria-label={`Nudge ${person.name}`}
      className={cx(chipClass, "border-rule-strong bg-sheet text-ink hover:border-pen hover:bg-pen-soft hover:text-pen-deep disabled:opacity-60")}
    >
      {face}
      {person.name}
      {busyMark(busy)}
    </button>
  );
}

export function NudgeChips({
  tripId,
  task,
  people,
  place,
}: {
  tripId: number;
  task: NudgeTask;
  people: NudgePerson[];
  place: { chips: string; end: string; note: string };
}) {
  const { busy, note, press } = useNudgePress(tripId, task);
  const box = useRef<HTMLDivElement>(null);
  const ruler = useRef<HTMLDivElement>(null);
  const ordered = openFirst(people);
  const shown = useFitCount(box, ruler, ordered.length);
  const hidden = ordered.slice(shown).filter((p) => !p.nudged);
  const open = ordered.filter((p) => !p.nudged);
  const pressOne = (p: NudgePerson) => press(p.userId, [p.userId]);

  return (
    <>
      <div ref={box} className={cx("relative flex min-w-0 items-center justify-end gap-1.5", place.chips)}>
        <div ref={ruler} aria-hidden inert className="invisible absolute right-0 flex gap-1.5">
          {ordered.map((p) => (
            <Chip key={p.userId} person={p} busy={false} />
          ))}
        </div>
        {ordered.slice(0, shown).map((p) => (
          <Chip key={p.userId} person={p} busy={busy === p.userId || busy === "all"} onPress={() => pressOne(p)} />
        ))}
        {hidden.length > 0 ? (
          <Menu label="Nudge someone else" triggerClassName="grid h-[31px] w-[26px] shrink-0 place-items-center rounded-sm border border-transparent text-ink-faint hover:border-pen hover:bg-pen-soft hover:text-pen-deep">
            {hidden.map((p) => (
              <form key={p.userId} action={() => pressOne(p)}>
                <button type="submit" role="menuitem" className={menuItemClass}>
                  Nudge {p.name}
                </button>
              </form>
            ))}
          </Menu>
        ) : null}
      </div>
      <div className={cx("flex items-center justify-end", place.end)}>
        {open.length === 0 ? (
          <NudgedMark />
        ) : (
          <Button type="button" disabled={busy !== null} onClick={() => press("all", open.map((p) => p.userId))}>
            Nudge all{busyMark(busy === "all")}
          </Button>
        )}
      </div>
      {note ? (
        <div className={cx("flex justify-end", place.note)}>
          <NudgeNote note={note} />
        </div>
      ) : null}
    </>
  );
}
