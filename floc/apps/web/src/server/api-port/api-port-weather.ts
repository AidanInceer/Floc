import "server-only";

import type { FlocPort } from "@floc/api/port";

import { scoped } from "@/server/api-port/api-port-scope";
import { canUseFeature } from "@/server/billing/entitlements";
import { getTripForecast } from "@/server/itinerary/weather";

type WeatherPort = Pick<FlocPort, "loadTripForecast">;

export const weatherPort: WeatherPort = {
  async loadTripForecast(viewerId, tripId) {
    await scoped(viewerId, tripId);
    const [unlocked, forecast] = await Promise.all([
      canUseFeature("dates.weather", tripId),
      getTripForecast(tripId),
    ]);
    return { locked: !unlocked, forecast };
  },
};
