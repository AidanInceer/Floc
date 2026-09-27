import type { Box, Point } from "../leader-line";

const curve = (a: Point, b: Point) => {
  const mid = (a.x + b.x) / 2;
  return `M${a.x} ${a.y} C${mid} ${a.y} ${mid} ${b.y} ${b.x} ${b.y}`;
};

/**
 * A route line from an ask to its card, landing level with the card's middle.
 * A far-column card is reached through the gap at `gapX` between two near
 * cards, then straight in, so no line crosses a card.
 */
export function markLine(from: Point, card: Box, gapX?: number): string {
  const y = card.top + card.height / 2;
  if (gapX === undefined) return curve(from, { x: card.left, y });
  return `${curve(from, { x: gapX, y })} L${card.left} ${y}`;
}
