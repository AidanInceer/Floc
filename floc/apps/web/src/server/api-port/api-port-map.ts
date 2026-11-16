import "server-only";

import type { FlocPort } from "@floc/api/port";

import { readCountryCode } from "@floc/core/people/countries";
import { refresh } from "@/server/freshness";
import {
  clearManualMark,
  derivedStateFor,
  setManualMark,
} from "@/server/itinerary/travel-map";

type MapPort = Pick<FlocPort, "setCountryMark">;

export const mapPort: MapPort = {
  async setCountryMark(viewerId, code, next) {
    const countryCode = readCountryCode(code);
    if (!countryCode) return;

    if (next === "green" || next === "yellow") {
      await setManualMark(viewerId, countryCode, next);
    } else if (await derivedStateFor(viewerId, countryCode)) {
      await setManualMark(viewerId, countryCode, "none");
    } else {
      await clearManualMark(viewerId, countryCode);
    }

    refresh({ kind: "profile" });
  },
};
