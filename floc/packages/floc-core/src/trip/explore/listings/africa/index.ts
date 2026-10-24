import type { PresetTrip } from "../../preset-trip-types";

import { moroccoAtlasSahara } from "./morocco-atlas-sahara";
import { egyptCairoAndTheNile } from "./egypt-cairo-and-the-nile";
import { capeToVictoriaFalls } from "./cape-to-victoria-falls";
import { masaiMaraToZanzibar } from "./masai-mara-to-zanzibar";
import { ugandaAndRwanda } from "./uganda-and-rwanda";
import { sossusvleiAndSwakopmund } from "./sossusvlei-and-swakopmund";
import { capeTownAndWinelands } from "./cape-town-and-winelands";
import { marrakechAndToubkal } from "./marrakech-and-toubkal";
import { stoneTownAndPaje } from "./stone-town-and-paje";
import { okavangoDeltaShort } from "./okavango-delta-short";
import { lalibelaAndSimien } from "./lalibela-and-simien";
import { accraAndCapeCoast } from "./accra-and-cape-coast";
import { dakarAndSaloum } from "./dakar-and-saloum";
import { victoriaFallsBothSides } from "./victoria-falls-both-sides";
import { djerbaAndTheSahara } from "./djerba-and-the-sahara";

// Order is the order on Explore; the first few lead the map. `pnpm explore:new` adds a line here.
export const AFRICA: PresetTrip[] = [
  moroccoAtlasSahara,
  egyptCairoAndTheNile,
  capeToVictoriaFalls,
  masaiMaraToZanzibar,
  ugandaAndRwanda,
  sossusvleiAndSwakopmund,
  capeTownAndWinelands,
  marrakechAndToubkal,
  stoneTownAndPaje,
  okavangoDeltaShort,
  lalibelaAndSimien,
  accraAndCapeCoast,
  dakarAndSaloum,
  victoriaFallsBothSides,
  djerbaAndTheSahara,
];
