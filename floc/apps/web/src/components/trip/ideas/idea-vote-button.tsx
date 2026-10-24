import type { ComponentProps } from "react";

import { cx } from "@/components/system/ui";
import { ArrowUpIcon } from "@/components/system/icons";
import { voteLabel } from "@floc/core/trip/ideas";

/** The vote on an idea: one look for a member's form and a guest's button (#442). */
export function IdeaVoteButton({
  title,
  votes,
  mine,
  ...props
}: { title: string; votes: number; mine: boolean } & Omit<ComponentProps<"button">, "children">) {
  return (
    <button
      {...props}
      aria-pressed={mine}
      aria-label={`${mine ? "Take back your vote for" : "Vote for"} “${title}” — ${voteLabel(votes, mine)}`}
      className={cx(
        "grid size-11 shrink-0 place-content-center justify-items-center gap-0.5 rounded-sm border text-ink-soft transition-colors disabled:opacity-60",
        mine ? "border-green-edge bg-green-soft text-green" : "border-rule-strong bg-sheet hover:border-pen hover:text-ink",
      )}
    >
      <ArrowUpIcon size={12} />
      <span className="nums text-xs leading-none">{votes}</span>
    </button>
  );
}
