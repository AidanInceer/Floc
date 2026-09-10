/**
 * The four writes that change a trip itself: rename/recolour/retag, archive,
 * restore, delete.
 *
 * WHY A HOOK AND NOT TWO ROUTES. The trip's header opens this sheet, and so
 * does the card on the trips list — the web puts the same menu in both places,
 * so the phone has two callers for one job. Copying eighty lines of mutation
 * and invalidation into the second one is how the two drift apart. It lives in
 * `lib/` beside the client it uses; the routes still own the sheet and the
 * state, this only owns the wire.
 *
 * `onGone` is fired by archive and delete, never by save: both take the trip
 * off the list you were looking at, so the caller has to go somewhere.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { TripColor } from "@floc/core/trip/trip-color";

import { trpc } from "./api";

export type TripEditPayload = { name: string; color: TripColor | null; tags: string[] };

export function useTripWrite(tripId: number, onGone: () => void) {
  const queryClient = useQueryClient();

  // The list draws the same name, colour and tags as the trip does, so it is
  // stale the moment any of this lands — a card that disagrees with the trip
  // it opens is worse than one that reloads.
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
    /** A blank name is not a rename; the caller's field keeps whatever it had. */
    save: (draft: TripEditPayload) => {
      if (draft.name.trim() === "") return;
      save.mutate({ tripId, name: draft.name.trim(), colorKey: draft.color, tags: draft.tags });
    },
    setArchived: (archived: boolean) => archive.mutate({ tripId, archived }),
    destroy: () => destroy.mutate({ tripId }),
    saving: save.isPending,
    saved: save.isSuccess,
    leaving: archive.isPending || destroy.isPending,
    error: save.isError ? save.error.message : null,
  };
}
