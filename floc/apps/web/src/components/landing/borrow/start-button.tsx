"use client";

import { ButtonLink, cx } from "@/components/system/ui";
import type { BorrowCard as Card } from "@/lib/landing/borrow";
import { listingStartHref } from "@/lib/landing/start-trip";

import { Glyph } from "@/components/system/icons/landing";

type Props = { card: Card; signedIn: boolean; variant: "ghost" | "primary"; className?: string; label?: string };

/** "Start from Japan": the listing on Explore with its copy sheet open, through sign-up for a visitor. */
export function StartButton({ card, signedIn, variant, className, label = `Start from ${card.place}` }: Props) {
  return (
    <ButtonLink href={listingStartHref(signedIn, card.id)} variant={variant} className={cx("borrow-start", className)}>
      {label} <Glyph name="arrow" />
    </ButtonLink>
  );
}
