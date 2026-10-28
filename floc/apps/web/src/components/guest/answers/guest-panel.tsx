import Link from "next/link";
import type { ReactNode } from "react";

import { ErrorText } from "@/components/system/ui";
import type { AnswerPlace, GuestAnswer } from "./use-guest-answer";

export function GuestPanel({ title, aside, place, answer, signUpHref, children }: {
  title: string;
  aside?: ReactNode;
  place: AnswerPlace;
  answer: GuestAnswer;
  signUpHref: string;
  children: ReactNode;
}) {
  const outcome = answer.outcomeAt(place);
  return (
    <section className="rounded-md border border-rule bg-sheet px-4 pb-3 pt-3">
      <div className="flex min-h-9 items-center justify-between gap-3">
        <h2 className="font-display text-lg">{title}</h2>
        {aside}
      </div>
      {children}
      {outcome?.error ? <ErrorText>{outcome.error}</ErrorText> : null}
      {outcome && !outcome.error ? (
        <p role="status" className="pt-2 text-[13px] text-ink-soft">
          Saved.{" "}
          <Link href={signUpHref} className="text-pen underline underline-offset-2 hover:text-pen-deep">
            Sign up
          </Link>{" "}
          within a week to keep it.
        </p>
      ) : null}
    </section>
  );
}
