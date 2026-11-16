import type { Box } from "@/components/explore/atlas/tag-place";

const INSET = 24;

const beside = (band: Box, card: Box | null): card is Box =>
  card !== null && card.left > band.left && card.top < band.bottom && card.bottom > band.top;

export function clearArea(band: Box, card: Box | null): Box {
  const right = beside(band, card) ? card.left - band.left : band.right - band.left;
  return { left: INSET, top: INSET, right: right - INSET, bottom: band.bottom - band.top - INSET };
}
