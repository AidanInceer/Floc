"use client";

import { startTripFromPreset } from "@/app/explore/actions";
import { SubmitButton } from "@/components/system/client-ui";
import { ButtonLink, cx } from "@/components/system/ui";
import type { BorrowCard as Card } from "@/lib/landing/borrow";

import { Glyph } from "../landing-glyph";

type Props = { card: Card; signedIn: boolean; variant: "ghost" | "primary"; className?: string };

/** "Start from Japan": copies the listing into a new trip, or sends a visitor to sign up first. */
export function StartButton({ card, signedIn, variant, className }: Props) {
  const label = (
    <>
      Start from {card.place} <Glyph name="arrow" />
    </>
  );
  if (!signedIn) {
    return (
      <ButtonLink href="/signup" variant={variant} className={cx("borrow-start", className)}>
        {label}
      </ButtonLink>
    );
  }
  return (
    <form action={startTripFromPreset} className="borrow-start">
      <input type="hidden" name="presetId" value={card.id} />
      <SubmitButton variant={variant} pendingLabel="Starting…" className={className}>
        {label}
      </SubmitButton>
    </form>
  );
}
