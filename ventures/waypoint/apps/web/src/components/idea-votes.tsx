"use client";

// Three-state vote on a board note (v0.2 ticket 09): one row of buttons that
// are both control and count. Ticket 36 swapped the text labels for the
// comment thread's own heart/thumbs glyphs (ReactionGlyph) — the word
// survives on aria-label/title, so nothing is colour- or picture-only.
// Every button is a neutral chip; only the viewer's own vote fills in.
import { useTransition } from "react";

import { ReactionGlyph, type GlyphKind } from "@/components/reaction-glyph";
import { cx } from "@/components/ui";
import type { VoteValue } from "@/db/schema";

// Stored enum values are untouched (up/dont_mind/down); glyph mapping lives
// here instead of renaming the column, which would mean migrating every row.
const OPTIONS: { value: VoteValue; glyph: GlyphKind; label: string }[] = [
  { value: "up", glyph: "heart", label: "Keen" },
  { value: "dont_mind", glyph: "up", label: "Don't mind" },
  { value: "down", glyph: "down", label: "Rather not" },
];

// Greyscale, not pastel: a pastel fill was lost against the pastel idea card
// (ticket 196 refresh). Unreacted is a neutral chip; the viewer's own vote
// fills to dark ink, which reads on any card colour.
const MINE = "bg-ink text-sheet";

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
            aria-label={
              mine
                ? `${o.label} — ${count}, your vote. Select again to clear it`
                : `${o.label} — ${count}`
            }
            title={mine ? `${o.label} — your vote, select again to clear` : o.label}
            onClick={() =>
              startTransition(async () => {
                if (mine) await clearVote(tripId, ideaId);
                else await castVote(tripId, ideaId, o.value);
              })
            }
            className={cx(
              // Fixed height so a chip doesn't grow as its count hits two digits.
              "inline-flex h-[26px] min-w-0 shrink items-center gap-1.5 rounded-full px-2.5 font-mono text-[10.5px] leading-none tracking-[0.02em] transition-colors",
              mine ? MINE : "bg-sheet-2 text-ink-soft hover:bg-sheet-3",
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
