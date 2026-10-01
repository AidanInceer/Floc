import type { PresetDetail } from "./preset-detail-types";
import { AMALFI_SLOW_WEEK } from "./trips/europe/amalfi-slow-week";
import { ANDALUSIA_ROAD_TRIP } from "./trips/europe/andalusia-road-trip";
import { BALI_VILLA_WEEK } from "./trips/asia/bali-villa-week";
import { CANADA_ROCKIES_LAKES } from "./trips/americas/canada-rockies-lakes";
import { COSTA_RICA_VOLCANO_AND_COAST } from "./trips/americas/costa-rica-volcano-and-coast";
import { EGYPT_CAIRO_AND_THE_NILE } from "./trips/africa/egypt-cairo-and-the-nile";
import { FIJI_YASAWA_ISLANDS } from "./trips/oceania/fiji-yasawa-islands";
import { GREAT_BARRIER_REEF_WEEK } from "./trips/oceania/great-barrier-reef-week";
import { ICELAND_RING_ROAD } from "./trips/europe/iceland-ring-road";
import { JAPAN_GOLDEN_ROUTE } from "./trips/asia/japan-golden-route";
import { KENYA_MARA_AND_COAST } from "./trips/africa/kenya-mara-and-coast";
import { MEXICO_YUCATAN_LOOP } from "./trips/americas/mexico-yucatan-loop";
import { MOROCCO_ATLAS_SAHARA } from "./trips/africa/morocco-atlas-sahara";
import { NEW_ZEALAND_NORTH_ISLAND } from "./trips/oceania/new-zealand-north-island";
import { NEW_ZEALAND_SOUTH_ISLAND } from "./trips/oceania/new-zealand-south-island";
import { PATAGONIA_W_TREK } from "./trips/americas/patagonia-w-trek";
import { PERU_SACRED_VALLEY } from "./trips/americas/peru-sacred-valley";
import { PORTUGAL_SURF_AND_WINE } from "./trips/europe/portugal-surf-and-wine";
import { RAJASTHAN_FORTS_AND_PALACES } from "./trips/asia/rajasthan-forts-and-palaces";
import { SCOTTISH_HIGHLANDS_BOTHY } from "./trips/europe/scottish-highlands-bothy";
import { SOUTH_AFRICA_CAPE_AND_GARDEN_ROUTE } from "./trips/africa/south-africa-cape-and-garden-route";
import { SYDNEY_AND_BLUE_MOUNTAINS } from "./trips/oceania/sydney-and-blue-mountains";
import { THAILAND_ANDAMAN_ISLANDS } from "./trips/asia/thailand-andaman-islands";
import { VIETNAM_NORTH_TO_SOUTH } from "./trips/asia/vietnam-north-to-south";
import { ZANZIBAR_SLOW_WEEK } from "./trips/africa/zanzibar-slow-week";

// Keyed by listing id. To write a listing's page: add a file in `trips/<region>/`, add
// its line here, and run this folder's tests — they check it against the listing.
const PRESET_DETAILS: Record<string, PresetDetail> = {
  "amalfi-slow-week": AMALFI_SLOW_WEEK,
  "andalusia-road-trip": ANDALUSIA_ROAD_TRIP,
  "bali-villa-week": BALI_VILLA_WEEK,
  "canada-rockies-lakes": CANADA_ROCKIES_LAKES,
  "costa-rica-volcano-and-coast": COSTA_RICA_VOLCANO_AND_COAST,
  "egypt-cairo-and-the-nile": EGYPT_CAIRO_AND_THE_NILE,
  "fiji-yasawa-islands": FIJI_YASAWA_ISLANDS,
  "great-barrier-reef-week": GREAT_BARRIER_REEF_WEEK,
  "iceland-ring-road": ICELAND_RING_ROAD,
  "japan-golden-route": JAPAN_GOLDEN_ROUTE,
  "kenya-mara-and-coast": KENYA_MARA_AND_COAST,
  "mexico-yucatan-loop": MEXICO_YUCATAN_LOOP,
  "morocco-atlas-sahara": MOROCCO_ATLAS_SAHARA,
  "new-zealand-north-island": NEW_ZEALAND_NORTH_ISLAND,
  "new-zealand-south-island": NEW_ZEALAND_SOUTH_ISLAND,
  "patagonia-w-trek": PATAGONIA_W_TREK,
  "peru-sacred-valley": PERU_SACRED_VALLEY,
  "portugal-surf-and-wine": PORTUGAL_SURF_AND_WINE,
  "rajasthan-forts-and-palaces": RAJASTHAN_FORTS_AND_PALACES,
  "scottish-highlands-bothy": SCOTTISH_HIGHLANDS_BOTHY,
  "south-africa-cape-and-garden-route": SOUTH_AFRICA_CAPE_AND_GARDEN_ROUTE,
  "sydney-and-blue-mountains": SYDNEY_AND_BLUE_MOUNTAINS,
  "thailand-andaman-islands": THAILAND_ANDAMAN_ISLANDS,
  "vietnam-north-to-south": VIETNAM_NORTH_TO_SOUTH,
  "zanzibar-slow-week": ZANZIBAR_SLOW_WEEK,
};

export const PRESET_DETAIL_IDS = Object.keys(PRESET_DETAILS);

export function presetDetail(id: string): PresetDetail | null {
  return Object.hasOwn(PRESET_DETAILS, id) ? PRESET_DETAILS[id] : null;
}
