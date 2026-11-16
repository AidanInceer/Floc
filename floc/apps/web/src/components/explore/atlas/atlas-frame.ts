type Box = { left: number; top: number; right: number; bottom: number };

const TOP = 60;
const SIDE = 44;
const FOOT = 16;
const INSET = 8;

const covers = (map: Box, card: Box | null): card is Box =>
  card !== null && card.left < map.right && card.top < map.bottom && card.bottom > map.top;

export function openArea(map: Box, card: Box | null): Box {
  const width = covers(map, card) ? card.left - map.left : map.right - map.left;
  return { left: SIDE + INSET, top: TOP + INSET, right: width - INSET, bottom: map.bottom - map.top - FOOT - INSET };
}
