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
 * Ticket 36 swapped the words Keen / Don't mind / Rather not for the comment
 * thread's own heart / thumbs-up / thumbs-down glyphs, drawn from the shared
 * `ReactionGlyph`. Two reasons: an idea and its comments sit on screen together
 * and were saying the same thing in two vocabularies, and "Don't mind" spelled
 * out was the label that never fit one line inside a 224px note. The word
 * survives on the button's `aria-label` and `title`, so nothing is colour- or
 * picture-only (CLAUDE.md conventions).
 *
 * Colour rule: every button is the same neutral chip regardless of its count.
 * Only the *viewer's own* vote fills in — same move the reaction chips make.
 */
import { useTransition } from "react";

import { ReactionGlyph, type GlyphKind } from "@/components/reaction-glyph";
import { cx } from "@/components/ui";
import type { VoteValue } from "@/db/schema";

/**
 * The stored values are untouched — `up` is the strongest vote and now draws as
 * a heart, `dont_mind` as a thumbs-up, `down` as a thumbs-down. Renaming the
 * enum would mean migrating every `idea_vote` row to change a drawing, so the
 * mapping lives here instead and the database keeps its direction words.
 */
const OPTIONS: { value: VoteValue; glyph: GlyphKind; label: string; mine: string }[] = [
  { value: "up", glyph: "heart", label: "Keen", mine: "border-red-edge bg-red-soft text-red" },
  {
    value: "dont_mind",
    glyph: "up",
    label: "Don't mind",
    mine: "border-green-edge bg-green-soft text-green",
  },
  {
    value: "down",
    glyph: "down",
    label: "Rather not",
    mine: "border-highlight-edge bg-highlight-soft text-highlight-ink",
  },
];

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
      className={cx("flex flex-nowrap gap-1.5 text-center", pending && "opacity-60")}
    >
      {OPTIONS.map((o) => {
        const mine = value === o.value;
        const count = counts[o.value];
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={mine}
            /* The word, not the picture, is what a screen reader gets — and
               it says what clicking will do once you've already voted. */
            aria-label={
              mine
                ? `${o.label} — ${count}, your vote. Select again to clear it`
                : `${o.label} — ${count}`
            }
            title={mine ? `${o.label} — your vote, select again to clear` : o.label}
            onClick={() =>
              startTransition(async () => {
                // Picking your own vote again clears it — abstaining has to
                // stay reachable after you've voted once (v1 ticket 14).
                if (mine) await clearVote(tripId, ideaId);
                else await castVote(tripId, ideaId, o.value);
              })
            }
            className={cx(
              /* Fixed height rather than padding-derived, so a chip doesn't
                 grow the note's footer as its count crosses into two digits. */
              "inline-flex h-[22px] min-w-0 shrink items-center gap-1 rounded-full border px-2 font-mono text-[10.5px] leading-none tracking-[0.02em] transition-colors",
              mine
                ? o.mine
                : "border-rule-strong bg-sheet/70 text-ink-soft hover:border-ink-faint hover:bg-sheet",
            )}
          >
            <ReactionGlyph kind={o.glyph} mine={mine} size={14} />
            <span className="nums">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
