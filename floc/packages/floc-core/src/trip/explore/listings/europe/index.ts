import type { PresetTrip } from "../../preset-trip-types";

import { icelandRingRoad } from "./iceland-ring-road";
import { italyByRail } from "./italy-by-rail";
import { portoToSeville } from "./porto-to-seville";
import { croatiaAndMontenegro } from "./croatia-and-montenegro";
import { scottishHighlandsAndSkye } from "./scottish-highlands-and-skye";
import { lofotenCabins } from "./lofoten-cabins";
import { sloveniaLakeAndCaves } from "./slovenia-lake-and-caves";
import { faroToTaviraByTrain } from "./faro-to-tavira-by-train";
import { pugliaTrulliAndSea } from "./puglia-trulli-and-sea";
import { tbilisiAndKazbegi } from "./tbilisi-and-kazbegi";
import { albanianRiviera } from "./albanian-riviera";
import { naxosAndParos } from "./naxos-and-paros";
import { pragueToCeskyKrumlov } from "./prague-to-cesky-krumlov";
import { connemaraAndAran } from "./connemara-and-aran";
import { istanbulAndCappadocia } from "./istanbul-and-cappadocia";

// Order is the order on Explore; the first few lead the map. `pnpm explore:new` adds a line here.
export const EUROPE: PresetTrip[] = [
  icelandRingRoad,
  italyByRail,
  portoToSeville,
  croatiaAndMontenegro,
  scottishHighlandsAndSkye,
  lofotenCabins,
  sloveniaLakeAndCaves,
  faroToTaviraByTrain,
  pugliaTrulliAndSea,
  tbilisiAndKazbegi,
  albanianRiviera,
  naxosAndParos,
  pragueToCeskyKrumlov,
  connemaraAndAran,
  istanbulAndCappadocia,
];
