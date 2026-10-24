import type { PresetTrip } from "../../preset-trip-types";

import { mexicoYucatanLoop } from "./mexico-yucatan-loop";
import { costaRicaVolcanoAndCoast } from "./costa-rica-volcano-and-coast";
import { bostonToSavannah } from "./boston-to-savannah";
import { peruSacredValley } from "./peru-sacred-valley";
import { patagoniaWTrek } from "./patagonia-w-trek";
import { banffToJasper } from "./banff-to-jasper";
import { medellinAndGuatape } from "./medellin-and-guatape";
import { antiguaAndAtitlan } from "./antigua-and-atitlan";
import { havanaAndVinales } from "./havana-and-vinales";
import { atacamaUnderTheStars } from "./atacama-under-the-stars";
import { mendozaWineAndAndes } from "./mendoza-wine-and-andes";
import { oaxacaForFood } from "./oaxaca-for-food";
import { galapagosByLand } from "./galapagos-by-land";
import { zionAndBryce } from "./zion-and-bryce";
import { salarDeUyuni } from "./salar-de-uyuni";

// Order is the order on Explore; the first few lead the map. `pnpm explore:new` adds a line here.
export const AMERICAS: PresetTrip[] = [
  mexicoYucatanLoop,
  costaRicaVolcanoAndCoast,
  bostonToSavannah,
  peruSacredValley,
  patagoniaWTrek,
  banffToJasper,
  medellinAndGuatape,
  antiguaAndAtitlan,
  havanaAndVinales,
  atacamaUnderTheStars,
  mendozaWineAndAndes,
  oaxacaForFood,
  galapagosByLand,
  zionAndBryce,
  salarDeUyuni,
];
