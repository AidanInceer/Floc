"use client";

import { useState, useTransition } from "react";

export type AnswerPlace = "ideas" | "dates";
type Outcome = { place: AnswerPlace; error: string | null };

/** One answer at a time, and what came of the last one, said where it was given (#442). */
export function useGuestAnswer() {
  const [last, setLast] = useState<Outcome | null>(null);
  const [pending, startTransition] = useTransition();

  return {
    pending,
    outcomeAt: (place: AnswerPlace) => (last?.place === place ? last : null),
    run(place: AnswerPlace, answer: () => Promise<{ error?: string }>, done?: () => void) {
      startTransition(async () => {
        const result = await answer();
        setLast({ place, error: result.error ?? null });
        if (!result.error) done?.();
      });
    },
  };
}

export type GuestAnswer = ReturnType<typeof useGuestAnswer>;
