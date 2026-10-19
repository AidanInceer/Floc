type Box = { left: number; top: number; right: number; bottom: number };

// Why: the globe runs up behind the 60px top bar; the "Every trip" button sits in the left and bottom margins.
const TOP = 60;
const SIDE = 44;
const FOOT = 16;
const INSET = 8;

const covers = (map: Box, card: Box | null): card is Box =>
  card !== null && card.left < map.right && card.top < map.bottom && card.bottom > map.top;

/** The part of the map neither the card nor the map's own controls cover, measured from the map's top-left corner. */
export function openArea(map: Box, card: Box | null): Box {
  const width = covers(map, card) ? card.left - map.left : map.right - map.left;
  return { left: SIDE + INSET, top: TOP + INSET, right: width - INSET, bottom: map.bottom - map.top - FOOT - INSET };
}
