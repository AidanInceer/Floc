import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { trpc } from "@/lib/api";

const SHOWN_MS = 8000;
const NOT_SAVED = "That did not save. Try again.";

export type IdeaNotice = { text: string; see?: () => void; undo?: () => void };

export function useIdeaActions(tripId: number) {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<IdeaNotice | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), SHOWN_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const again = () => queryClient.invalidateQueries({ queryKey: trpc.ideas.list.queryKey({ tripId }) });
  const againWithDays = () =>
    Promise.all([again(), queryClient.invalidateQueries({ queryKey: trpc.itinerary.days.queryKey({ tripId }) })]);
  const onError = () => setNotice({ text: NOT_SAVED });

  const addOne = useMutation({ ...trpc.ideas.add.mutationOptions(), onSuccess: again, onError });
  const voteOne = useMutation({ ...trpc.ideas.vote.mutationOptions(), onSuccess: again, onError });
  const renameOne = useMutation({ ...trpc.ideas.rename.mutationOptions(), onSuccess: again, onError });
  const removeOne = useMutation({ ...trpc.ideas.remove.mutationOptions(), onSuccess: again, onError });
  const restoreOne = useMutation({ ...trpc.ideas.restore.mutationOptions(), onSuccess: again, onError });
  const placeOne = useMutation({ ...trpc.ideas.addToDays.mutationOptions(), onSuccess: againWithDays, onError });
  const unplaceOne = useMutation({ ...trpc.ideas.takeOffDays.mutationOptions(), onSuccess: againWithDays, onError });

  return {
    notice,
    adding: addOne.isPending,
    placing: placeOne.isPending,
    add: (title: string, category: string, done: () => void, closed: boolean) =>
      addOne.mutate({ tripId, title, category }, {
        onSuccess: () => {
          done();
          if (closed) setNotice({ text: `Added ${title.trim()}` });
        },
      }),
    vote: (ideaId: number) => voteOne.mutate({ tripId, ideaId }),
    rename: (ideaId: number, title: string) => renameOne.mutate({ tripId, ideaId, title }),
    remove: (ideaId: number, title: string) =>
      removeOne.mutate({ tripId, ideaId }, {
        onSuccess: () =>
          setNotice({
            text: `Removed ${title}`,
            undo: () => {
              setNotice(null);
              restoreOne.mutate({ tripId, ideaId });
            },
          }),
      }),
    place: (ideaId: number, dayId: number, time: string | null, label: string, see: () => void, done: () => void) =>
      placeOne.mutate({ tripId, ideaId, dayId, time }, {
        onSuccess: () => {
          done();
          setNotice({
            text: `Added to ${label}`,
            see,
            undo: () => {
              setNotice(null);
              unplaceOne.mutate({ tripId, ideaId });
            },
          });
        },
      }),
  };
}
