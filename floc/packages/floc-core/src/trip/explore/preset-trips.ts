import { AFRICA } from "./listings/africa/index";
import { AMERICAS } from "./listings/americas/index";
import { ASIA } from "./listings/asia/index";
import { EUROPE } from "./listings/europe/index";
import { OCEANIA } from "./listings/oceania/index";
import type { PresetTrip } from "./preset-trip-types";

export { REGIONS } from "./preset-trip-types";
export type { PresetTrip, Region } from "./preset-trip-types";

export const PRESET_TRIPS: PresetTrip[] = [...ASIA, ...EUROPE, ...AFRICA, ...AMERICAS, ...OCEANIA];
