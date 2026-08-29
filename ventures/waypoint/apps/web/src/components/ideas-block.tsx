/**
 * The voting board, as one block inside the Notes doc (ticket 238).
 *
 * The board's data is a server read, but a BlockNote block renders wherever the
 * editor puts it and takes no props of ours — so the page hands it down a
 * context instead.
 */
"use client";

import { createContext, useContext, useMemo, useState } from "react";

import { Button } from "@/components/ui";
import { SubmitButton } from "@/components/client-ui";
import type { IdeaCardData } from "@/components/idea-data";
import { IdeasBoard } from "@/components/ideas-board";
import { voteScore } from "@/lib/votes";
import { postIdea } from "@/app/trip/[id]/notes/actions";

export type IdeasBlockData = {
  ideas: IdeaCardData[];
  tripId: number;
  viewerId: string;
  isAdmin: boolean;
};

const IdeasBlockContext = createContext<IdeasBlockData | null>(null);

export const IdeasBlockProvider = IdeasBlockContext.Provider;

type SortMode = "new" | "liked";

export function IdeasBlockBody() {
  const data = useContext(IdeasBlockContext);
  // Sort is a view of the board, not a fact about the trip — local state here,
  // where the old page kept it in the URL it no longer has (ticket 238).
  const [sort, setSort] = useState<SortMode>("new");
  const ideas = data?.ideas;

  const inOrder = useMemo(() => {
    if (!ideas) return [];
    // Newest-first default: voting is optional, so a tally-first order would
    // rank an unvoted good idea below a stale one.
    const base =
      sort === "liked"
        ? [...ideas].sort((a, b) => voteScore(b.votes) - voteScore(a.votes))
        : ideas;
    // Pinning overrides sort (ticket 09): pinned lead, oldest pin first.
    return [
      ...base
        .filter((i) => i.pinnedAt !== null)
        .sort((a, b) => a.pinnedAt!.getTime() - b.pinnedAt!.getTime()),
      ...base.filter((i) => i.pinnedAt === null),
    ];
  }, [ideas, sort]);

  if (!data) return null;
  const { tripId, viewerId, isAdmin } = data;

  return (
    <div
      data-app-block=""
      className="w-full rounded-2xl border border-butter-edge bg-butter px-5 py-5"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="typed">Ideas board</p>
        {inOrder.length > 1 ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={sort === "new" ? "primary" : "secondary"}
              aria-pressed={sort === "new"}
              onClick={() => setSort("new")}
              className="px-3 py-1 text-[11px]"
            >
              Newest
            </Button>
            <Button
              type="button"
              variant={sort === "liked" ? "primary" : "secondary"}
              aria-pressed={sort === "liked"}
              onClick={() => setSort("liked")}
              className="px-3 py-1 text-[11px]"
            >
              Most liked
            </Button>
          </div>
        ) : null}
      </div>

      <form
        action={postIdea.bind(null, tripId)}
        className="mb-4 flex flex-wrap items-center gap-3"
      >
        <label className="min-w-[16rem] flex-1">
          <span className="sr-only">Post an idea</span>
          <input
            name="note"
            required
            maxLength={2000}
            placeholder="A place, a vibe, a whole trip shape…"
            className="w-full rounded-md border border-rule-strong bg-sheet px-4 py-2.5 text-sm placeholder:text-ink-faint focus-visible:border-pen"
          />
        </label>
        <SubmitButton pendingLabel="Pinning…" className="w-full sm:w-auto">
          Pin it to the board
        </SubmitButton>
      </form>

      {inOrder.length === 0 ? (
        <p className="text-sm text-ink-soft">
          A place, a vibe, or a whole itinerary — the first one is what gets a
          trip moving.
        </p>
      ) : (
        <IdeasBoard
          ideas={inOrder}
          tripId={tripId}
          viewerId={viewerId}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
