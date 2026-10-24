import type { PresetTrip } from "../../preset-trip-types";

import { japanGoldenRoute } from "./japan-golden-route";
import { hanoiToBangkok } from "./hanoi-to-bangkok";
import { thailandAndamanIslands } from "./thailand-andaman-islands";
import { rajasthanFortsAndPalaces } from "./rajasthan-forts-and-palaces";
import { sriLankaRoadAndRail } from "./sri-lanka-road-and-rail";
import { seoulAndBusan } from "./seoul-and-busan";
import { taipeiAndTaroko } from "./taipei-and-taroko";
import { luangPrabangSlow } from "./luang-prabang-slow";
import { palawanIslandHop } from "./palawan-island-hop";
import { kathmanduAndPoonHill } from "./kathmandu-and-poon-hill";
import { ubudAndNusaPenida } from "./ubud-and-nusa-penida";
import { samarkandAndBukhara } from "./samarkand-and-bukhara";
import { hoiAnAndHue } from "./hoi-an-and-hue";
import { petraAndWadiRum } from "./petra-and-wadi-rum";
import { kyushuOnsenLoop } from "./kyushu-onsen-loop";

// Order is the order on Explore; the first few lead the map. `pnpm explore:new` adds a line here.
export const ASIA: PresetTrip[] = [
  japanGoldenRoute,
  hanoiToBangkok,
  thailandAndamanIslands,
  rajasthanFortsAndPalaces,
  sriLankaRoadAndRail,
  seoulAndBusan,
  taipeiAndTaroko,
  luangPrabangSlow,
  palawanIslandHop,
  kathmanduAndPoonHill,
  ubudAndNusaPenida,
  samarkandAndBukhara,
  hoiAnAndHue,
  petraAndWadiRum,
  kyushuOnsenLoop,
];
