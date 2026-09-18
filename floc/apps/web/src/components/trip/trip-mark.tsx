// The mark a trip wears (#318), stroked in the trip's own pastel ink.
import { TRIP_MARK_ART } from "@floc/core/trip/mark/trip-mark-art";
import type { TripMark } from "@floc/core/trip/mark/trip-mark";
import { IconArtMark } from "@/components/system/icon-art";

export function TripMarkIcon({ mark, size = 16 }: { mark: TripMark; size?: number }) {
  return <IconArtMark art={TRIP_MARK_ART[mark]} size={size} />;
}
