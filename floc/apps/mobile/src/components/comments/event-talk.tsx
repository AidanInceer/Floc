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

  const comments = useQuery(
    trpc.comments.onEvent.queryOptions({ tripId, dayEventId }),
  );

  const settled = {
    onSuccess: () => {
      setProblem(null);
      queryClient.invalidateQueries({
        queryKey: trpc.comments.onEvent.queryKey({ tripId, dayEventId }),
      });
    },
    onError: (error: { message: string }) => setProblem(error.message),
  };

  const said = {
    onSuccess: (refusal: string | null) => {
      setProblem(refusal);
      if (!refusal) settled.onSuccess();
    },
    onError: settled.onError,
  };

  const add = useMutation({ ...trpc.comments.add.mutationOptions(), ...said });
  const edit = useMutation({
    ...trpc.comments.edit.mutationOptions(),
    ...said,
  });
  const remove = useMutation({
    ...trpc.comments.remove.mutationOptions(),
    ...settled,
  });
  const react = useMutation({
    ...trpc.comments.react.mutationOptions(),
    ...settled,
  });

  if (comments.isPending) return <Loading />;
  if (comments.isError) return <Failed onRetry={() => comments.refetch()} />;

  return (
    <CommentThread
      comments={comments.data}
      viewerId={viewerId}
      busy={add.isPending || edit.isPending || remove.isPending}
      problem={problem}
      actions={{
        onAdd: (replyTo, body, landed) =>
          add.mutate(
            { tripId, dayEventId, replyTo, body },
            { onSuccess: (refusal) => refusal || landed() },
          ),
        onEdit: (commentId, body, landed) =>
          edit.mutate(
            { tripId, commentId, body },
            { onSuccess: (refusal) => refusal || landed() },
          ),
        onDelete: (commentId) => remove.mutate({ tripId, commentId }),
        onReact: (commentId, kind) => react.mutate({ tripId, commentId, kind }),
        onClearProblem: () => setProblem(null),
      }}
    />
  );
}
