/**
 * What the phone's Notes screen reads and writes through the API (#408): the
 * page list, trip links, the open page's comments, and every change to the
 * list. A refusal comes back as the sentence to show.
 */
import type { PageThread } from "@floc/editor/view/comments";
import type { Comment } from "@floc/api/port";
import type { PageIcon } from "@floc/core/notes/pages/page-icons";
import { commentTime } from "@floc/core/notes/notes";
import { whoTone } from "@floc/core/people/who";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import { trpc } from "@/lib/api";

function toThread(row: Comment, toneOf: Map<string, string>, now: Date): PageThread {
  const post = (comment: Comment) => ({
    id: comment.id,
    name: comment.authorName,
    tone: toneOf.get(comment.createdBy) ?? whoTone(comment.authorName),
    body: comment.body,
    when: commentTime(new Date(comment.createdAt), now),
  });
  return { id: row.id, posts: [post(row), ...row.replies.map(post)] };
}

export function useNotesData(tripId: number, pageId: number | null) {
  const client = useQueryClient();
  const ready = Number.isFinite(tripId);
  const [error, setError] = useState<string | null>(null);
  const list = useQuery(trpc.pages.list.queryOptions({ tripId }, { enabled: ready }));
  const links = useQuery(trpc.pages.links.queryOptions({ tripId }, { enabled: ready }));
  const trip = useQuery(trpc.trips.get.queryOptions({ tripId }, { enabled: ready }));
  const comments = useQuery(trpc.pages.comments.queryOptions({ tripId, pageId: pageId ?? 0 }, { enabled: ready && pageId !== null }));

  const refresh = useCallback(() => {
    void client.invalidateQueries({ queryKey: trpc.pages.list.queryKey({ tripId }) });
    void client.invalidateQueries({ queryKey: trpc.pages.comments.queryKey() });
  }, [client, tripId]);

  const heard = (refused: string | null) => {
    setError(refused);
    refresh();
    return refused;
  };
  const create = useMutation(trpc.pages.create.mutationOptions());
  const rename = useMutation(trpc.pages.rename.mutationOptions());
  const setIcon = useMutation(trpc.pages.setIcon.mutationOptions());
  const move = useMutation(trpc.pages.move.mutationOptions());
  const archive = useMutation(trpc.pages.archive.mutationOptions());
  const restore = useMutation(trpc.pages.restore.mutationOptions());
  const comment = useMutation(trpc.pages.comment.mutationOptions());
  const resolve = useMutation(trpc.pages.resolve.mutationOptions());

  const threads = useMemo(() => {
    const toneOf = new Map((trip.data?.members ?? []).map((member) => [member.userId, member.tone]));
    const now = new Date();
    return (comments.data ?? []).map((row) => toThread(row, toneOf, now));
  }, [comments.data, trip.data?.members]);

  return {
    list,
    links: links.data ?? [],
    threads,
    error,
    refresh,
    create: async (parentId: number | null) => {
      const made = await create.mutateAsync({ tripId, parentId });
      heard("error" in made ? made.error : null);
      return "error" in made ? null : made.id;
    },
    rename: async (id: number, title: string) => {
      const refused = heard(await rename.mutateAsync({ tripId, pageId: id, title }));
      if (refused) throw new Error(refused);
    },
    setIcon: async (id: number, icon: PageIcon | null) => {
      await setIcon.mutateAsync({ tripId, pageId: id, icon });
      heard(null);
    },
    move: async (id: number, beforeId: number | null) => heard(await move.mutateAsync({ tripId, pageId: id, beforeId })),
    archive: async (id: number) => heard(await archive.mutateAsync({ tripId, pageId: id })),
    restore: async (id: number) => heard(await restore.mutateAsync({ tripId, pageId: id })),
    startThread: async (body: string): Promise<number | { error: string }> => {
      if (pageId === null) return { error: "That page has gone." };
      const made = await comment.mutateAsync({ tripId, pageId, replyTo: null, body });
      refresh();
      return "error" in made ? made : made.id;
    },
    reply: async (threadId: number, body: string): Promise<string | null> => {
      if (pageId === null) return "That page has gone.";
      const made = await comment.mutateAsync({ tripId, pageId, replyTo: threadId, body });
      refresh();
      return "error" in made ? made.error : null;
    },
    resolve: async (threadId: number) => {
      await resolve.mutateAsync({ tripId, commentId: threadId });
      refresh();
    },
  };
}
