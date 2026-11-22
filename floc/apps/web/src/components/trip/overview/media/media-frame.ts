const BAR_HEIGHT = "3.25rem";
const SMALLEST_CARD = "20rem";
const ROOM_UNDER_BAR = `100cqh - ${BAR_HEIGHT}`;

export function trueRatio(width: number, height: number, fallback: number): number {
  return width > 0 && height > 0 ? width / height : fallback;
}

export function viewerFrame(ratio: number) {
  return {
    card: { width: `max(min(${SMALLEST_CARD}, 100cqw), min(100cqw, calc((${ROOM_UNDER_BAR}) * ${ratio})))` },
    bar: { height: BAR_HEIGHT },
    picture: { aspectRatio: ratio, maxHeight: `calc(${ROOM_UNDER_BAR})` },
  };
}
