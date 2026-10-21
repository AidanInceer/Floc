import type { Box } from "@/components/explore/atlas/tag-place";

const INSET = 24;

const beside = (band: Box, card: Box | null): card is Box =>
  card !== null && card.left > band.left && card.top < band.bottom && card.bottom > band.top;

/** The part of the band the route may use, from the band's top-left corner: left of the floating card, or all of it when the card sits below. */
export function clearArea(band: Box, card: Box | null): Box {
  const right = beside(band, card) ? card.left - band.left : band.right - band.left;
  return { left: INSET, top: INSET, right: right - INSET, bottom: band.bottom - band.top - INSET };
}
