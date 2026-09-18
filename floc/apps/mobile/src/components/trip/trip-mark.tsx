/**
 * The mark a trip wears (#318). Same geometry as the web app —
 * @floc/core/trip/mark/trip-mark-art holds it, so the two cannot drift.
 */
import type { TripMark } from "@floc/core/trip/mark/trip-mark";
import { TRIP_MARK_ART } from "@floc/core/trip/mark/trip-mark-art";

import { IconArtMark } from "../system/icon-art";

export function TripMarkIcon({
  mark,
  color,
  size = 16,
}: {
  mark: TripMark;
  color: string;
  size?: number;
}) {
  return <IconArtMark art={TRIP_MARK_ART[mark]} color={color} size={size} />;
}
