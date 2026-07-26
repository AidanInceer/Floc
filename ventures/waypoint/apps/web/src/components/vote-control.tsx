"use client";

/**
 * The viewer's own three-state vote (ticket 14). Rendered as a segmented
 * control, not a single toggle, because "don't mind" is a real answer, not a
 * midpoint UI trick — and picking the same value again clears the vote so
 * abstaining stays reachable after voting once.
 */
import { useTransition } from "react";

import { Segmented } from "@/components/client-ui";
import type { VoteValue } from "@/db/schema";

const OPTIONS: { value: VoteValue; label: string }[] = [
  { value: "up", label: "Keen" },
  { value: "dont_mind", label: "Don't mind" },
  { value: "down", label: "Rather not" },
];

export function VoteControl({
  tripId,
  ideaId,
  value,
  castVote,
  clearVote,
}: {
  tripId: number;
  ideaId: number;
  value: VoteValue | null;
  castVote: (tripId: number, ideaId: number, value: VoteValue) => Promise<void>;
  clearVote: (tripId: number, ideaId: number) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div aria-busy={pending} className={pending ? "opacity-60" : undefined}>
      <Segmented
        name={`vote-${ideaId}`}
        value={value}
        options={OPTIONS}
        onSelect={(next) =>
          startTransition(async () => {
            if (next === value) {
              await clearVote(tripId, ideaId);
            } else {
              await castVote(tripId, ideaId, next);
            }
          })
        }
      />
    </div>
  );
}
