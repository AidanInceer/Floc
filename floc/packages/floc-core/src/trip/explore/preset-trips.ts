// Static listings for Explore, one file per trip in `listings/<region>/` (`pnpm explore:new` adds one): no partner backend; operator names are illustrative.
// See docs/product/explore/partner-trips.html. Money is minor units (rule 1); format with `formatMoney`.
import { AFRICA } from "./listings/africa/index";
import { AMERICAS } from "./listings/americas/index";
import { ASIA } from "./listings/asia/index";
import { EUROPE } from "./listings/europe/index";
import { OCEANIA } from "./listings/oceania/index";
import type { PresetTrip } from "./preset-trip-types";

export { REGIONS } from "./preset-trip-types";
export type { PresetTrip, Region } from "./preset-trip-types";

// Asia first, so Explore opens on Tokyo to Osaka.
export const PRESET_TRIPS: PresetTrip[] = [...ASIA, ...EUROPE, ...AFRICA, ...AMERICAS, ...OCEANIA];
