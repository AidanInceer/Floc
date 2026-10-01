import type { PresetDetail } from "./preset-detail-types";
import { JAPAN_GOLDEN_ROUTE } from "./trips/japan-golden-route";

// Keyed by listing id. To write a listing's page: add a file in `trips/`, add
// its line here, and run this folder's tests — they check it against the listing.
const PRESET_DETAILS: Record<string, PresetDetail> = {
  "japan-golden-route": JAPAN_GOLDEN_ROUTE,
};

export const PRESET_DETAIL_IDS = Object.keys(PRESET_DETAILS);

export function presetDetail(id: string): PresetDetail | null {
  return Object.hasOwn(PRESET_DETAILS, id) ? PRESET_DETAILS[id] : null;
}
