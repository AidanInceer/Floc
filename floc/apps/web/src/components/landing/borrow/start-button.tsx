"use client";

import { ButtonLink, cx } from "@/components/system/ui";
import { placeWords, type BorrowCard as Card } from "@/lib/landing/borrow";
import { listingStartHref } from "@/lib/landing/start-trip";

import { Glyph } from "@/components/system/icons/landing";

type Props = { card: Card; signedIn: boolean; variant: "ghost" | "primary"; className?: string; label?: string };

export function StartButton({ card, signedIn, variant, className, label }: Props) {
  return (
    <ButtonLink href={listingStartHref(signedIn, card.id)} variant={variant} className={cx("borrow-start", className)}>
      {label ?? (
        <>
          Start from {placeWords(card.place)}
          {placeWords(card.place) !== card.place && <span className="sr-only">: {card.place}</span>}
        </>
      )}{" "}
      <Glyph name="arrow" />
    </ButtonLink>
  );
}
