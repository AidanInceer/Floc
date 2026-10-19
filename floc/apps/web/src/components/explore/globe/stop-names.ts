import { placeTags, type Box, type Point } from "@/components/explore/atlas/tag-place";
import type { StopPin } from "@/lib/landing/globe/deep";

const PIN_HALF = 13;

/**
 * Puts each stop's name beside its pin, clear of the other pins, the names before it and the route line.
 * `host` holds one child a pin, each with a `.route-tag`; only the stops that show take part.
 */
export function placeNames(host: HTMLElement, spots: readonly Point[], pins: readonly StopPin[], view: Box) {
  const shown = [...host.children].flatMap((el, k) => {
    const tag = el instanceof HTMLElement && !el.hidden ? el.querySelector<HTMLElement>(".route-tag") : null;
    return tag && spots[k] ? [{ tag, at: spots[k], k }] : [];
  });
  const at = shown.map((s) => s.at);
  const sizes = shown.map(({ tag }) => ({ width: tag.offsetWidth, height: tag.offsetHeight }));
  // The line visits the pins in stop order; a pin the route comes back to is on it twice.
  const order = shown.flatMap(({ k }, i) => pins[k]!.stops.map((stop) => ({ stop, i }))).sort((a, b) => a.stop - b.stop);
  placeTags(at, sizes, view, order.map(({ i }) => at[i]!)).forEach((offset, i) => {
    const { tag } = shown[i]!;
    tag.style.left = `${PIN_HALF + offset.x}px`;
    tag.style.top = `${PIN_HALF + offset.y}px`;
  });
}
