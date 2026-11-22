import { cx } from "@/components/system/ui";
import { placeWords, type BorrowCard as Card } from "@/lib/landing/borrow";

export function PlaceWord({ card, tone }: { card: Card; tone: string }) {
  return (
    <span className="borrow-slot">
      <span className={cx("borrow-word transition-colors duration-500", tone)}>
        <span key={card.id} className="borrow-roll">
          <span aria-hidden="true">{placeWords(card.place)}</span>
          <span className="sr-only">{card.place}</span>
        </span>
      </span>
    </span>
  );
}
