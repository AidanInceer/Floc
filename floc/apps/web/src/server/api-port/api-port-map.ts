/**
 * The port's travel-map half (tickets 95, 108; split out of `api-port.ts`).
 *
 * A HAND MARK ALWAYS WINS. Trip marks are derived on read and never stored;
 * a row in `user_country_mark` overrides one permanently, which is why
 * painting green writes even where a trip already agrees — otherwise a trip
 * ending later would demote something you said by hand.
 *
 * BLANK IS TWO ANSWERS. Over a country nothing claims, it is a deletion. Over
 * one a trip *is* claiming, it is a rejection — a `none` row saying "no, I
 * didn't go" — because without it the app keeps asserting something false.
 */
import "server-only";

import type { FlocPort, MapPrompt } from "@floc/api/port";

import { readCountryCode } from "@floc/core/people/countries";
import { refresh } from "@/server/freshness";
import { clearMapPrompt, hasPendingMapPrompt } from "@/server/trips/roster";
import {
  clearManualMark,
  derivedStateFor,
  keepMarksFromTrip,
  pendingMapPrompts,
  setManualMark,
} from "@/server/itinerary/travel-map";

type MapPort = Pick<FlocPort, "listMapPrompts" | "answerMapPrompt" | "setCountryMark">;

export const mapPort: MapPort = {
  async listMapPrompts(viewerId): Promise<MapPrompt[]> {
    const prompts = await pendingMapPrompts(viewerId);
    // `MapState` on the host is the same two words the wire uses; the cast is
    // the seam admitting that rather than re-deriving the union.
    return prompts.map((prompt) => ({
      tripId: prompt.tripId,
      tripName: prompt.tripName,
      countries: prompt.countries.map((c) => ({
        code: c.code,
        state: c.state as "green" | "yellow",
      })),
    }));
  },

  async answerMapPrompt(viewerId, tripId, keep) {
    // A question nobody parked is not answerable — and this is the guard that
    // stops one person answering for somebody else.
    if (!(await hasPendingMapPrompt(tripId, viewerId))) return;

    if (keep) await keepMarksFromTrip(viewerId, tripId);
    await clearMapPrompt(tripId, viewerId);

    refresh({ kind: "profile" });
  },

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
