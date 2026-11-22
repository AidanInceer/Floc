import "server-only";

import { homeCurrenciesFor } from "@/server/auth/profile";
import { listRouteDays } from "@/server/itinerary/itinerary";
import { getHomeRates } from "@/server/money/fx";
import { listExpenses, listSplits } from "@/server/money/money";
import { readEstimateChoices, readTravelProfile, type Money, type OwnRow } from "@/server/money/estimate/estimate-store";
import { flightsSeenBy } from "@/server/money/estimate/flights-seen";
import type { Currency } from "@floc/core/money/currency";
import { convertMinor } from "@floc/core/money/money";
import { guideFor, guideIn, type GuideLine } from "@floc/core/money/estimate/guide/guide";
import { findAirport, loadAirports } from "@floc/core/money/estimate/guide/airports/airports";
import { airportName, inferHomeAirport } from "@floc/core/money/estimate/guide/home-airport";
import type { EstimateLine } from "@floc/core/money/estimate/lines";
import { planFor, type OwnLine } from "@floc/core/money/estimate/plan";
import { spentByLine } from "@floc/core/money/estimate/spent";
import { resolveStyle } from "@floc/core/money/estimate/style";
import { tripShape } from "@floc/core/money/estimate/guide/trip-shape";
import type { EstimateView } from "@floc/core/money/estimate/view";

export type { EstimateView } from "@floc/core/money/estimate/view";

type TripDates = { id: number; startDate: string | null; endDate: string | null };
type Ledger = { expenses: Awaited<ReturnType<typeof listExpenses>>; splits: Awaited<ReturnType<typeof listSplits>>; days: Awaited<ReturnType<typeof listRouteDays>> };

export async function readEstimate(trip: TripDates, viewerId: string, known?: Ledger): Promise<EstimateView> {
  const [profile, choices, days, homes, expenses, splits] = await Promise.all([
    readTravelProfile(viewerId),
    readEstimateChoices(trip.id, viewerId),
    known?.days ?? listRouteDays(trip.id),
    homeCurrenciesFor([viewerId]),
    known?.expenses ?? listExpenses(trip.id),
    known?.splits ?? listSplits(trip.id),
  ]);
  const currency = homes.get(viewerId) ?? "GBP";
  const [rates, inferred, airports] = await Promise.all([
    getHomeRates(currency),
    profile.homeAirport ? null : flightsSeenBy(viewerId).then(inferHomeAirport),
    loadAirports(),
  ]);
  const toHome: Partial<Record<Currency, number>> = rates?.toHome ?? {};
  const homeCode = profile.homeAirport ?? inferred;
  const style = resolveStyle(profile, choices.style);
  const shape = tripShape({ start: trip.startDate, end: trip.endDate, days, chosenNights: choices.nights });
  const travel = choices.travel ?? "flights";
  const guide = guideFor({ home: homeCode, style, nights: shape.nights.count, stops: shape.stops, travel }).lines.map((l) => inHome(l, currency, toHome.GBP ?? null));
  const inCurrency = (m: Money | null) => (m ? convert(m.amountMinor, m.currency, currency, toHome) : null);

  return {
    currency,
    style,
    home: homeView(homeCode, !profile.homeAirport, airports),
    nights: shape.nights,
    places: shape.stops.length > 0,
    plan: planFor({
      guide,
      own: ownIn(choices.own, currency, toHome),
      spent: spentByLine({ expenses, splits, viewerId, home: currency, toHome }).byLine,
      budget: inCurrency(choices.budget),
      travel,
    }),
  };
}

function homeView(code: string | null, inferred: boolean, airports: Awaited<ReturnType<typeof loadAirports>>): EstimateView["home"] {
  return code ? { code, name: findAirport(airports, code)?.name ?? airportName(code), inferred } : null;
}

function inHome(line: GuideLine, currency: Currency, gbpRate: number | null): GuideLine {
  if (!line.range) return line;
  const range = guideIn(line.range, currency, gbpRate);
  return range ? { ...line, range } : { ...line, range: null, missing: "rate" };
}

function convert(amount: number, from: Currency, to: Currency, toHome: Partial<Record<Currency, number>>): number | null {
  if (from === to) return amount;
  const rate = toHome[from];
  return rate ? convertMinor(amount, from, to, rate) : null;
}

function ownIn(own: Partial<Record<EstimateLine, OwnRow>>, currency: Currency, toHome: Partial<Record<Currency, number>>) {
  const out: Partial<Record<EstimateLine, OwnLine>> = {};
  for (const [line, row] of Object.entries(own) as [EstimateLine, OwnRow][]) {
    out[line] = {
      figure: row.figure == null ? null : convert(row.figure, row.currency, currency, toHome),
      budget: row.budget == null ? null : convert(row.budget, row.currency, currency, toHome),
      notNeeded: row.notNeeded,
    };
  }
  return out;
}
