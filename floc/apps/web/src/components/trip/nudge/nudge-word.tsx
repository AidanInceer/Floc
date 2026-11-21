"use client";

import type { NudgePerson, NudgeTask } from "@floc/core/trip/nudge/nudge";
import { busyMark, cx, pressArea } from "@/components/system/ui";
import { NudgedMark, NudgeNote } from "./nudged-mark";
import { useNudgePress } from "./use-nudge-press";

const nudgeWordClass = cx(
  pressArea,
  "-mx-2 inline-flex h-[26px] shrink-0 items-center rounded-sm px-2 text-sm font-medium text-pen transition-colors hover:bg-pen-soft hover:text-pen-deep disabled:pointer-events-none disabled:opacity-60",
);

export function NudgeWord({ tripId, task, person }: { tripId: number; task: NudgeTask; person: NudgePerson }) {
  const { busy, note, press } = useNudgePress(tripId, task);
  if (person.nudged) return <NudgedMark />;
  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-x-2">
      <NudgeNote note={note} />
      <button
        type="button"
        className={nudgeWordClass}
        disabled={busy !== null}
        aria-label={`Nudge ${person.name}`}
        onClick={() => press(person.userId, [person.userId])}
      >
        Nudge{busyMark(busy !== null)}
      </button>
    </span>
  );
}
