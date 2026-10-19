// Static listings for the Explore mockup, five a region: no partner backend; operator names are illustrative.
// See docs/product/explore/partner-trips.html. Money is minor units (rule 1); format with `formatMoney`.
import { AFRICA } from "./listings/africa";
import { AMERICAS } from "./listings/americas";
import { ASIA } from "./listings/asia";
import { EUROPE } from "./listings/europe";
import { OCEANIA } from "./listings/oceania";
import type { PresetTrip } from "./preset-trip-types";

export { REGIONS } from "./preset-trip-types";
export type { PresetTrip, Region } from "./preset-trip-types";

// Asia first, so Explore opens on Tokyo to Osaka.
export const PRESET_TRIPS: PresetTrip[] = [...ASIA, ...EUROPE, ...AFRICA, ...AMERICAS, ...OCEANIA];
