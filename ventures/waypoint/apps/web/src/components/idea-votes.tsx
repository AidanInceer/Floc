"use client";

/**
 * The three-state vote on a board note (v0.2 ticket 09), replacing the old
 * segmented control + separate tally badges. One row of three buttons that are
 * both the control and the count — on a sticky note there isn't room for the
 * same information twice, and two separate widgets made it unclear that the
 * tally was even clickable.
 *
 * The model is untouched from v1 ticket 14: three states, no reason field,
 * picking your current vote again clears it, and abstaining stays legitimate.
 *
 * Colour rule: every button is the same neutral chip regardless of its count.
 * Only the *viewer's own* vote is filled, and the value's word is on the
 * button either way — status is never colour alone (CLAUDE.md conventions).
 */
import { useTransition } from "react";

import { cx } from "@/components/ui";
import type { VoteValue } from "@/db/schema";

const OPTIONS: { value: VoteValue; label: string; tone: "agreed" | "neutral" | "action" }[] = [
  { value: "up", label: "Keen", tone: "agreed" },
  { value: "dont_mind", label: "Don't mind", tone: "neutral" },
  { value: "down", label: "Rather not", tone: "action" },
];

const MINE: Record<"agreed" | "neutral" | "action", string> = {
  agreed: "border-green bg-green-soft text-green",
  neutral: "border-ink-faint bg-sheet-3 text-ink",
  action: "border-red bg-red-soft text-red",
};

export function IdeaVotes({
  tripId,
  ideaId,
  value,
  counts,
  castVote,
  clearVote,
}: {
  tripId: number;
  ideaId: number;
  value: VoteValue | null;
  counts: Record<VoteValue, number>;
  castVote: (tripId: number, ideaId: number, value: VoteValue) => Promise<void>;
  clearVote: (tripId: number, ideaId: number) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="radiogroup"
      aria-label="Your vote"
      aria-busy={pending}
      // One line, never two: three buttons wrapping onto a second row put more
      // visual weight on the controls than on the idea they're about.
      className={cx("flex flex-nowrap gap-1 text-center", pending && "opacity-60")}
    >
      {OPTIONS.map((o) => {
        const mine = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={mine}
            onClick={() =>
              startTransition(async () => {
                // Picking your own vote again clears it — abstaining has to
                // stay reachable after you've voted once (v1 ticket 14).
                if (mine) await clearVote(tripId, ideaId);
                else await castVote(tripId, ideaId, o.value);
              })
            }
            className={cx(
              "min-w-0 shrink rounded-full border px-1.5 py-1 text-[10px] font-medium whitespace-nowrap transition-colors",
              mine
                ? MINE[o.tone]
                : "border-rule-strong bg-sheet/70 text-ink-soft hover:border-ink-faint hover:bg-sheet",
            )}
          >
            {/* No "·" between label and count — the three buttons have to fit
                one line inside a 224px note, and the separator was the 2px
                that pushed "Don't mind" over the edge. */}
            {o.label} <span className="nums">{counts[o.value]}</span>
            {mine ? <span className="sr-only"> — your vote</span> : null}
          </button>
        );
      })}
    </div>
  );
}
