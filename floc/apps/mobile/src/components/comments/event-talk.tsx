/**
 * One event's thread, fetched (ticket 325).
 *
 * SPLIT FROM `comment-thread` ON PURPOSE. That file draws a run and knows
 * nothing about the network, which is what makes it testable and what keeps
 * the reply/edit/react rules in one place. This one is the wiring, and it is
 * the only part that would have to change if the thread ever hung off
 * something other than an event.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { CommentThread } from "./comment-thread";
import { Failed, Loading } from "../system/ui";
import { trpc } from "@/lib/api";

export function EventTalk({
  tripId,
  dayEventId,
  viewerId,
}: {
  tripId: number;
  dayEventId: number;
  viewerId: string;
}) {
  const queryClient = useQueryClient();
  const [problem, setProblem] = useState<string | null>(null);

  const comments = useQuery(trpc.comments.onEvent.queryOptions({ tripId, dayEventId }));

  const settled = {
    onSuccess: () => {
      setProblem(null);
      queryClient.invalidateQueries({
        queryKey: trpc.comments.onEvent.queryKey({ tripId, dayEventId }),
      });
    },
    onError: (error: { message: string }) => setProblem(error.message),
  };

  // Add and edit answer with the sentence the composer shows, or null when it
  // landed — a comment that has since gone is an ordinary mistake, not a throw.
  const said = {
    onSuccess: (refusal: string | null) => {
      setProblem(refusal);
      if (!refusal) settled.onSuccess();
    },
    onError: settled.onError,
  };

  const add = useMutation({ ...trpc.comments.add.mutationOptions(), ...said });
  const edit = useMutation({ ...trpc.comments.edit.mutationOptions(), ...said });
  const remove = useMutation({ ...trpc.comments.remove.mutationOptions(), ...settled });
  const react = useMutation({ ...trpc.comments.react.mutationOptions(), ...settled });

  if (comments.isPending) return <Loading />;
  if (comments.isError) return <Failed onRetry={() => comments.refetch()} />;

  return (
    <CommentThread
      comments={comments.data}
      viewerId={viewerId}
      busy={add.isPending || edit.isPending || remove.isPending}
      problem={problem}
      actions={{
        onAdd: (replyTo, body) => add.mutate({ tripId, dayEventId, replyTo, body }),
        onEdit: (commentId, body) => edit.mutate({ tripId, commentId, body }),
        onDelete: (commentId) => remove.mutate({ tripId, commentId }),
        onReact: (commentId, kind) => react.mutate({ tripId, commentId, kind }),
      }}
    />
  );
}
