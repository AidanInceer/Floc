"use client";

import { ButtonLink, cx } from "@/components/system/ui";
import type { BorrowCard as Card } from "@/lib/landing/borrow";
import { listingStartHref } from "@/lib/landing/start-trip";

import { Glyph } from "../landing-glyph";

type Props = { card: Card; signedIn: boolean; variant: "ghost" | "primary"; className?: string };

/** "Start from Japan": the listing on Explore with its copy sheet open, through sign-up for a visitor. */
export function StartButton({ card, signedIn, variant, className }: Props) {
  return (
    <ButtonLink href={listingStartHref(signedIn, card.id)} variant={variant} className={cx("borrow-start", className)}>
      Start from {card.place} <Glyph name="arrow" />
    </ButtonLink>
  );
}
