import type { Region } from "@floc/core/trip/explore/preset-trips";

import { regionSkin } from "@/components/explore/listing";
import { regionTone } from "@/components/explore/trip/region-tone";

/** A tile's pastel is its listing's region, as the tag wears it on Explore; the headline word and the rail match. */
export const tone = (region: Region) => regionSkin(region);

export const toneDot = (region: Region) => regionTone(region).dot;
