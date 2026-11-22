import "server-only";

import type { TripAccess } from "@/server/access";
import { homeCurrenciesFor } from "@/server/auth/profile";
import { assertFeature } from "@/server/billing/entitlements";
import { refresh } from "@/server/freshness";
import { setBudget, setOwnLine, setTravelProfile, setTripNights, setTripStyle, setTripTravel, type OwnLinePatch, type TravelProfile } from "@/server/money/estimate/estimate-store";
import { Refusal } from "@floc/core/errors/refusal";
import type { Currency } from "@floc/core/money/currency";
import { isAirportCode } from "@floc/core/money/estimate/guide/home-airport";
import type { EstimateLine } from "@floc/core/money/estimate/lines";
import type { StyleChoice } from "@floc/core/money/estimate/style";
import type { TravelMode } from "@floc/core/money/estimate/travel";
import { maxExpenseMinor } from "@floc/core/money/money";

const MAX_EST_NIGHTS = 365;

async function homeOf(userId: string): Promise<Currency> {
  return (await homeCurrenciesFor([userId])).get(userId) ?? "GBP";
}

function checkAmount(amount: number | null | undefined, currency: Currency): void {
  if (amount == null) return;
  if (!Number.isInteger(amount) || amount < 0 || amount > maxExpenseMinor(currency)) {
    throw new Refusal("Enter an amount of zero or more.");
  }
}

function changed(access: TripAccess) {
  refresh({ kind: "estimate", tripId: access.trip.id });
}

export async function saveBudget(access: TripAccess, amountMinor: number | null): Promise<void> {
  await assertFeature("money.estimate", access.viewer.id);
  const currency = await homeOf(access.viewer.id);
  checkAmount(amountMinor, currency);
  await setBudget(access.trip.id, access.viewer.id, amountMinor == null ? null : { amountMinor, currency });
  changed(access);
}

export async function saveTripTravel(access: TripAccess, travel: TravelMode): Promise<void> {
  await assertFeature("money.estimate", access.viewer.id);
  await setTripTravel(access.trip.id, access.viewer.id, travel);
  changed(access);
}

export async function saveOwnLine(access: TripAccess, line: EstimateLine, patch: OwnLinePatch): Promise<void> {
  await assertFeature("money.estimate", access.viewer.id);
  const currency = await homeOf(access.viewer.id);
  checkAmount(patch.figure, currency);
  checkAmount(patch.budget, currency);
  await setOwnLine(access.trip.id, access.viewer.id, line, patch, currency);
  changed(access);
}

export async function saveTripStyle(access: TripAccess, choice: StyleChoice | null): Promise<void> {
  await assertFeature("money.estimate", access.viewer.id);
  await setTripStyle(access.trip.id, access.viewer.id, choice);
  changed(access);
}

export async function saveTripNights(access: TripAccess, nights: number | null): Promise<void> {
  await assertFeature("money.estimate", access.viewer.id);
  if (nights != null && (!Number.isInteger(nights) || nights < 1 || nights > MAX_EST_NIGHTS)) {
    throw new Refusal(`Nights must be between 1 and ${MAX_EST_NIGHTS}.`);
  }
  await setTripNights(access.trip.id, access.viewer.id, nights);
  changed(access);
}

export async function saveTravelProfile(userId: string, patch: Partial<TravelProfile>): Promise<void> {
  await assertFeature("money.estimate", userId);
  if (patch.homeAirport != null && !isAirportCode(patch.homeAirport)) {
    throw new Refusal("An airport code is three letters, such as LHR.");
  }
  await setTravelProfile(userId, patch);
  refresh({ kind: "accountSettings" });
}
