import type { Region } from "@floc/core/trip/explore/preset-trips";

import { regionSkin } from "@/components/explore/listing";
import { regionTone } from "@/components/explore/trip/region-tone";

export const tone = (region: Region) => regionSkin(region);

export const toneDot = (region: Region) => regionTone(region).dot;
