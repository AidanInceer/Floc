import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { TripColor } from "@floc/core/trip/trip-color";
import type { TripMark } from "@floc/core/trip/mark/trip-mark";

import { trpc } from "../api";

export type TripEditPayload = {
  name: string;
  color: TripColor | null;
  mark: TripMark | null;
  tags: string[];
};

export function useTripWrite(tripId: number, onGone: () => void) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: trpc.trips.get.queryKey({ tripId }) });
    queryClient.invalidateQueries({ queryKey: trpc.trips.list.queryKey() });
  };

  const save = useMutation({ ...trpc.trips.update.mutationOptions(), onSuccess: invalidate });
  const gone = () => {
    invalidate();
    onGone();
  };
  const archive = useMutation({ ...trpc.trips.setArchived.mutationOptions(), onSuccess: gone });
  const destroy = useMutation({ ...trpc.trips.delete.mutationOptions(), onSuccess: gone });

  return {
    save: (draft: TripEditPayload) => {
      if (draft.name.trim() === "") return;
      save.mutate({
        tripId,
        name: draft.name.trim(),
        colorKey: draft.color,
        mark: draft.mark,
        tags: draft.tags,
      });
    },
    setArchived: (archived: boolean) => archive.mutate({ tripId, archived }),
    destroy: () => destroy.mutate({ tripId }),
    saving: save.isPending,
    saved: save.isSuccess,
    leaving: archive.isPending || destroy.isPending,
    error: save.isError ? save.error.message : null,
  };
}
