import type { NudgeTask } from "@floc/core/trip/nudge/nudge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { trpc } from "@/lib/api";

export type NudgePress = { busy: string | null; note: string | null; press: (key: string, userIds: string[]) => void };

export function useNudge(tripId: number, task: NudgeTask): NudgePress {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const send = useMutation({
    ...trpc.nudges.send.mutationOptions(),
    onSuccess: (result) => {
      if (result.capped) setNote("That is enough nudges for today.");
      return queryClient.invalidateQueries({ queryKey: trpc.nudges.targets.queryKey({ tripId }) });
    },
    onError: () => setNote("Could not send the nudge. Try again."),
    onSettled: () => setBusy(null),
  });

  const press = (key: string, userIds: string[]) => {
    setBusy(key);
    setNote(null);
    send.mutate({ tripId, task, userIds });
  };

  return { busy, note, press };
}
