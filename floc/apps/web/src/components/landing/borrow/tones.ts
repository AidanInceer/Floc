import type { Region } from "@floc/core/trip/explore/preset-trips";

import { regionSkin } from "@/components/explore/listing";

/** A tile's pastel is its listing's region, as the tag wears it on Explore; the headline word and the rail match. */
export const tone = (region: Region) => regionSkin(region);
