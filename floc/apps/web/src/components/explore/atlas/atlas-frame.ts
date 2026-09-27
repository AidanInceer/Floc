type Box = { left: number; top: number; right: number; bottom: number };

const EDGE = 40;
// Why: the map runs up behind the 60px top bar, the zoom and "Every trip" buttons take the left 44px,
// and the attribution the bottom 16px.
const TOP = 60;
const SIDE = 44;
const FOOT = 16;
const GAP = 24;
const INSET = 8;
const PIN_CLEAR = 20;
const ROOM_SHARE = 5;

const covers = (map: Box, card: Box | null): card is Box =>
  card !== null && card.left < map.right && card.top < map.bottom && card.bottom > map.top;

/** The part of the map neither the card nor the map's own controls cover, measured from the map's top-left corner. */
export function openArea(map: Box, card: Box | null): Box {
  const width = covers(map, card) ? card.left - map.left : map.right - map.left;
  return { left: SIDE + INSET, top: TOP + INSET, right: width - INSET, bottom: map.bottom - map.top - FOOT - INSET };
}

/** Padding that keeps a fitted view in the part of the map the card leaves clear, with up to `room` more on the right. */
export function clearOf(
  map: Box,
  card: Box | null,
  room = 0,
): { paddingTopLeft: [number, number]; paddingBottomRight: [number, number] } {
  const left = SIDE + PIN_CLEAR;
  const right = covers(map, card) ? map.right - card.left + GAP : EDGE;
  const clear = map.right - map.left - left - right;
  return {
    paddingTopLeft: [left, TOP + PIN_CLEAR],
    paddingBottomRight: [right + Math.min(room, Math.round(clear / ROOM_SHARE)), EDGE],
  };
}
