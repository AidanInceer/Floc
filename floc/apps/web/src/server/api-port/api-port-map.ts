import "server-only";

import type { FlocPort } from "@floc/api/port";

import { markCountry } from "@/server/itinerary/travel-map";

type MapPort = Pick<FlocPort, "setCountryMark">;

export const mapPort: MapPort = {
  setCountryMark: (viewerId, code, next) => markCountry(viewerId, code, next),
};
