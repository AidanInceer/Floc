export type Box = { left: number; top: number; right: number; bottom: number };
export type Padding = { top: number; right: number; bottom: number; left: number };

export const NAME_ROOM = 160;

const INSET = 56;
const ZOOM_BUTTONS = 40;

const covers = (band: Box, card: Box | null): card is Box =>
  card !== null && card.left > band.left && card.top < band.bottom && card.bottom > band.top;

export function fitPadding(band: Box, card: Box | null, nameRoom = 0): Padding {
  const underCard = covers(band, card) ? band.right - card.left : 0;
  return { top: INSET, right: underCard + INSET + nameRoom, bottom: INSET, left: INSET + ZOOM_BUTTONS };
}
