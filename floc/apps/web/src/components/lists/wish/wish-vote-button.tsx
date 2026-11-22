"use client";

import { voteLabel } from "@floc/core/trip/ideas";
import { useTransition } from "react";

import { toggleWishVoteAction } from "@/app/lists/wish/actions";
import { ArrowUpIcon } from "@/components/system/icons";
import { cx, pressArea } from "@/components/system/ui";

type Props = { listId: number; itemId: number; what: string; votes: number; mine: boolean; onDone?: () => void };

export function WishVoteButton({ listId, itemId, what, votes, mine, onDone }: Props) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={mine}
      aria-label={`${mine ? "Take back your vote for" : "Vote for"} “${what}” — ${voteLabel(votes, mine)}`}
      onClick={() =>
        start(async () => {
          const out = await toggleWishVoteAction(listId, itemId);
          if (!out.error) onDone?.();
        })
      }
      className={cx(
        pressArea,
        "flex h-[26px] shrink-0 items-center gap-1 rounded-sm border px-2 text-ink-soft transition-colors disabled:opacity-60",
        mine ? "border-green-edge bg-green-soft text-green" : "border-rule-strong bg-sheet hover:border-pen hover:text-ink",
      )}
    >
      <ArrowUpIcon size={12} />
      <span className="nums font-mono text-xs leading-none">{votes}</span>
    </button>
  );
}
