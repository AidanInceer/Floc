import type { PaintDiff } from "@floc/core/dates/finding/day-paint";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { trpc } from "@/lib/api";

export function useSaveMarks(tripId: number, onSaved: () => void) {
  const queryClient = useQueryClient();
  const set = useMutation(trpc.availability.set.mutationOptions());
  const prefer = useMutation(trpc.availability.prefer.mutationOptions());

  return useMutation({
    mutationFn: async (diff: PaintDiff) => {
      if (diff.add.length > 0) await set.mutateAsync({ tripId, dates: diff.add, available: true });
      if (diff.remove.length > 0) await set.mutateAsync({ tripId, dates: diff.remove, available: false });
      if (diff.prefer.on.length > 0) await prefer.mutateAsync({ tripId, dates: diff.prefer.on, preferred: true });
      if (diff.prefer.off.length > 0) await prefer.mutateAsync({ tripId, dates: diff.prefer.off, preferred: false });
    },
    onSuccess: onSaved,
    onSettled: () => queryClient.invalidateQueries({ queryKey: trpc.availability.list.queryKey({ tripId }) }),
  });
}
