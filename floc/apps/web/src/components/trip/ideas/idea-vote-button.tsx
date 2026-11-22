import type { ComponentProps } from "react";

import { cx, pressArea } from "@/components/system/ui";
import { ArrowUpIcon } from "@/components/system/icons";
import { voteLabel } from "@floc/core/trip/ideas";

export function IdeaVoteButton({
  title,
  votes,
  mine,
  fit = "tile",
  ...props
}: { title: string; votes: number; mine: boolean; fit?: "tile" | "row" } & Omit<ComponentProps<"button">, "children">) {
  return (
    <button
      {...props}
      aria-pressed={mine}
      aria-label={`${mine ? "Take back your vote for" : "Vote for"} “${title}” — ${voteLabel(votes, mine)}`}
      className={cx(
        "shrink-0 rounded-sm border text-ink-soft transition-colors disabled:opacity-60",
        fit === "row" ? cx(pressArea, "flex h-[26px] items-center gap-1 px-2") : "grid size-11 place-content-center justify-items-center gap-0.5",
        mine ? "border-green-edge bg-green-soft text-green" : "border-rule-strong bg-sheet hover:border-pen hover:text-ink",
      )}
    >
      <ArrowUpIcon size={12} />
      <span className="nums text-xs leading-none">{votes}</span>
    </button>
  );
}
