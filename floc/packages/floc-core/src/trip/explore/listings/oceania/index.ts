import type { PresetTrip } from "../../preset-trip-types";

import { newZealandSouthIsland } from "./new-zealand-south-island";
import { newZealandNorthIsland } from "./new-zealand-north-island";
import { sydneyToCairns } from "./sydney-to-cairns";
import { greatOceanRoadAndUluru } from "./great-ocean-road-and-uluru";
import { fijiYasawaIslands } from "./fiji-yasawa-islands";
import { queenstownAndWanaka } from "./queenstown-and-wanaka";
import { hobartAndFreycinet } from "./hobart-and-freycinet";
import { rotoruaAndTaupo } from "./rotorua-and-taupo";
import { byronAndTheHinterland } from "./byron-and-the-hinterland";
import { adelaideAndKangarooIsland } from "./adelaide-and-kangaroo-island";
import { bayOfIslandsSail } from "./bay-of-islands-sail";
import { vanuatuVolcano } from "./vanuatu-volcano";
import { portDouglasAndDaintree } from "./port-douglas-and-daintree";
import { fijiCoralCoast } from "./fiji-coral-coast";
import { sydneyAndBlueMountains } from "./sydney-and-blue-mountains";

// Order is the order on Explore; the first few lead the map. `pnpm explore:new` adds a line here.
export const OCEANIA: PresetTrip[] = [
  newZealandSouthIsland,
  newZealandNorthIsland,
  sydneyToCairns,
  greatOceanRoadAndUluru,
  fijiYasawaIslands,
  queenstownAndWanaka,
  hobartAndFreycinet,
  rotoruaAndTaupo,
  byronAndTheHinterland,
  adelaideAndKangarooIsland,
  bayOfIslandsSail,
  vanuatuVolcano,
  portDouglasAndDaintree,
  fijiCoralCoast,
  sydneyAndBlueMountains,
];
