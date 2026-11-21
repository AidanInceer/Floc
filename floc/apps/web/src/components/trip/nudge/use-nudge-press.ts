"use client";

import { useState, useTransition } from "react";

import type { NudgeTask } from "@floc/core/trip/nudge/nudge";
import { nudge } from "@/app/trip/[id]/overview/actions";

export type NudgePress = {
  busy: string | null;
  note: string | null;
  press: (key: string, userIds: string[]) => void;
};

export function useNudgePress(tripId: number, task: NudgeTask): NudgePress {
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const press = (key: string, userIds: string[]) => {
    setBusy(key);
    setNote(null);
    start(async () => {
      try {
        const result = await nudge(tripId, task, userIds);
        if (result.capped) setNote("That is enough nudges for today.");
      } catch {
        setNote("Could not send the nudge. Try again.");
      }
    });
  };

  return { busy: pending ? busy : null, note, press };
}
