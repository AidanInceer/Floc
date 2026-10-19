import type { PresetDetail } from "./preset-detail-types";
import { BOSTON_TO_SAVANNAH } from "./trips/americas/boston-to-savannah";
import { CAPE_TO_VICTORIA_FALLS } from "./trips/africa/cape-to-victoria-falls";
import { COSTA_RICA_VOLCANO_AND_COAST } from "./trips/americas/costa-rica-volcano-and-coast";
import { CROATIA_AND_MONTENEGRO } from "./trips/europe/croatia-and-montenegro";
import { EGYPT_CAIRO_AND_THE_NILE } from "./trips/africa/egypt-cairo-and-the-nile";
import { FIJI_YASAWA_ISLANDS } from "./trips/oceania/fiji-yasawa-islands";
import { GREAT_OCEAN_ROAD_AND_ULURU } from "./trips/oceania/great-ocean-road-and-uluru";
import { HANOI_TO_BANGKOK } from "./trips/asia/hanoi-to-bangkok";
import { ICELAND_RING_ROAD } from "./trips/europe/iceland-ring-road";
import { ITALY_BY_RAIL } from "./trips/europe/italy-by-rail";
import { JAPAN_GOLDEN_ROUTE } from "./trips/asia/japan-golden-route";
import { MASAI_MARA_TO_ZANZIBAR } from "./trips/africa/masai-mara-to-zanzibar";
import { MEXICO_YUCATAN_LOOP } from "./trips/americas/mexico-yucatan-loop";
import { MOROCCO_ATLAS_SAHARA } from "./trips/africa/morocco-atlas-sahara";
import { NEW_ZEALAND_NORTH_ISLAND } from "./trips/oceania/new-zealand-north-island";
import { NEW_ZEALAND_SOUTH_ISLAND } from "./trips/oceania/new-zealand-south-island";
import { PATAGONIA_W_TREK } from "./trips/americas/patagonia-w-trek";
import { PERU_SACRED_VALLEY } from "./trips/americas/peru-sacred-valley";
import { PORTO_TO_SEVILLE } from "./trips/europe/porto-to-seville";
import { RAJASTHAN_FORTS_AND_PALACES } from "./trips/asia/rajasthan-forts-and-palaces";
import { SCOTTISH_HIGHLANDS_AND_SKYE } from "./trips/europe/scottish-highlands-and-skye";
import { SRI_LANKA_ROAD_AND_RAIL } from "./trips/asia/sri-lanka-road-and-rail";
import { SYDNEY_TO_CAIRNS } from "./trips/oceania/sydney-to-cairns";
import { THAILAND_ANDAMAN_ISLANDS } from "./trips/asia/thailand-andaman-islands";
import { UGANDA_AND_RWANDA } from "./trips/africa/uganda-and-rwanda";

// Keyed by listing id. To write a listing's page: add a file in `trips/<region>/`, add
// its line here, and run this folder's tests — they check it against the listing.
const PRESET_DETAILS: Record<string, PresetDetail> = {
  "boston-to-savannah": BOSTON_TO_SAVANNAH,
  "cape-to-victoria-falls": CAPE_TO_VICTORIA_FALLS,
  "costa-rica-volcano-and-coast": COSTA_RICA_VOLCANO_AND_COAST,
  "croatia-and-montenegro": CROATIA_AND_MONTENEGRO,
  "egypt-cairo-and-the-nile": EGYPT_CAIRO_AND_THE_NILE,
  "fiji-yasawa-islands": FIJI_YASAWA_ISLANDS,
  "great-ocean-road-and-uluru": GREAT_OCEAN_ROAD_AND_ULURU,
  "hanoi-to-bangkok": HANOI_TO_BANGKOK,
  "iceland-ring-road": ICELAND_RING_ROAD,
  "italy-by-rail": ITALY_BY_RAIL,
  "japan-golden-route": JAPAN_GOLDEN_ROUTE,
  "masai-mara-to-zanzibar": MASAI_MARA_TO_ZANZIBAR,
  "mexico-yucatan-loop": MEXICO_YUCATAN_LOOP,
  "morocco-atlas-sahara": MOROCCO_ATLAS_SAHARA,
  "new-zealand-north-island": NEW_ZEALAND_NORTH_ISLAND,
  "new-zealand-south-island": NEW_ZEALAND_SOUTH_ISLAND,
  "patagonia-w-trek": PATAGONIA_W_TREK,
  "peru-sacred-valley": PERU_SACRED_VALLEY,
  "porto-to-seville": PORTO_TO_SEVILLE,
  "rajasthan-forts-and-palaces": RAJASTHAN_FORTS_AND_PALACES,
  "scottish-highlands-and-skye": SCOTTISH_HIGHLANDS_AND_SKYE,
  "sri-lanka-road-and-rail": SRI_LANKA_ROAD_AND_RAIL,
  "sydney-to-cairns": SYDNEY_TO_CAIRNS,
  "thailand-andaman-islands": THAILAND_ANDAMAN_ISLANDS,
  "uganda-and-rwanda": UGANDA_AND_RWANDA,
};

export const PRESET_DETAIL_IDS = Object.keys(PRESET_DETAILS);

export function presetDetail(id: string): PresetDetail | null {
  return Object.hasOwn(PRESET_DETAILS, id) ? PRESET_DETAILS[id] : null;
}
