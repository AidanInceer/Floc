"use client";

import type { NudgePerson, NudgeTask } from "@floc/core/trip/nudge/nudge";
import { busyMark, Button, cx } from "@/components/system/ui";
import { NudgedMark, NudgeNote } from "./nudged-mark";
import { useNudgePress } from "./use-nudge-press";

export function NudgeAll({ tripId, task, people, className }: { tripId: number; task: NudgeTask; people: NudgePerson[]; className?: string }) {
  const { busy, note, press } = useNudgePress(tripId, task);
  const open = people.filter((p) => !p.nudged);
  return (
    <span className={cx("inline-flex items-center justify-end gap-2", className)}>
      <NudgeNote note={note} />
      {open.length === 0 ? (
        <NudgedMark />
      ) : (
        <Button type="button" className="max-sm:flex-1" disabled={busy !== null} onClick={() => press("all", open.map((p) => p.userId))}>
          Nudge all{busyMark(busy !== null)}
        </Button>
      )}
    </span>
  );
}
