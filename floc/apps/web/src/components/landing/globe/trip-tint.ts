import type { Region } from "@floc/core/trip/explore/preset-trips";

import type { TripTint } from "@/components/explore/globe/trip-layer";
import type { Tint } from "@/components/globe/paint-globe";
import { regionToneName } from "@/components/explore/listing";
import { tripCodes } from "@/components/explore/outline/country";
import { ringsIn, type Piece, type Spot } from "@/components/explore/outline/land";

type Listing = { place: string; region: Region; route: { stops: readonly Spot[] } };

/** The borrowed trip's countries in its region's colour, as Explore fills them; the band has only the coarse outline. */
export function tripTint(land: readonly Piece[], { place, region, route }: Listing): TripTint {
  return { rings: ringsIn(land, [], tripCodes(place, route.stops, land)), tone: regionToneName(region) };
}

/** Why: the outline loads as the band nears the screen, so a trip opened first fills its countries once the outline arrives. */
export function liveTint(drawn: Tint | undefined, open: TripTint | null): Tint | undefined {
  return drawn && open ? { ...open, alpha: drawn.alpha } : drawn;
}
