"use server";

import { requireTripAccess, requireUser } from "@/server/access";
import { homeCurrenciesFor } from "@/server/auth/profile";
import {
  saveBudget,
  saveOwnLine,
  saveTravelProfile,
  saveTripNights,
  saveTripStyle,
  saveTripTravel,
} from "@/server/money/estimate/estimate-save";
import { orRefusal, Refusal } from "@floc/core/errors/refusal";
import type { Currency } from "@floc/core/money/currency";
import { isEstimateLine } from "@floc/core/money/estimate/lines";
import { isCabin, isPace, isStayStyle } from "@floc/core/money/estimate/style";
import { isTravelMode } from "@floc/core/money/estimate/travel";
import { parseMoney } from "@floc/core/money/money";

type Result = { error?: string };

function amount(raw: FormDataEntryValue | null, currency: Currency): number | null {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  try {
    return parseMoney(text, currency);
  } catch {
    throw new Refusal("Enter an amount, such as 450.");
  }
}

async function homeOf(userId: string): Promise<Currency> {
  return (await homeCurrenciesFor([userId])).get(userId) ?? "GBP";
}

export async function saveBudgetForm(tripId: number, formData: FormData): Promise<Result> {
  const access = await requireTripAccess(tripId);
  return orRefusal(async () => saveBudget(access, amount(formData.get("amount"), await homeOf(access.viewer.id))));
}

export async function saveLineForm(tripId: number, formData: FormData): Promise<Result> {
  const access = await requireTripAccess(tripId);
  return orRefusal(async () => {
    const line = formData.get("line");
    if (!isEstimateLine(line)) throw new Refusal("That line is not part of the estimate.");
    const currency = await homeOf(access.viewer.id);
    await saveOwnLine(access, line, {
      ...(formData.has("figure") && { figure: amount(formData.get("figure"), currency) }),
      ...(formData.has("budget") && { budget: amount(formData.get("budget"), currency) }),
      ...(formData.has("notNeeded") && { notNeeded: formData.get("notNeeded") === "true" }),
    });
  });
}

export async function saveTravelForm(tripId: number, formData: FormData): Promise<Result> {
  const access = await requireTripAccess(tripId);
  return orRefusal(async () => {
    const travel = formData.get("travel");
    if (!isTravelMode(travel)) throw new Refusal("Pick how you are getting there.");
    await saveTripTravel(access, travel);
  });
}

export async function saveStyleForm(tripId: number, formData: FormData): Promise<Result> {
  const access = await requireTripAccess(tripId);
  const [cabin, stay, pace] = [formData.get("cabin"), formData.get("stay"), formData.get("pace")];
  return orRefusal(() =>
    saveTripStyle(access, {
      ...(isCabin(cabin) && { cabin }),
      ...(isStayStyle(stay) && { stay }),
      ...(isPace(pace) && { pace }),
    }),
  );
}

export async function resetTripStyle(tripId: number): Promise<Result> {
  const access = await requireTripAccess(tripId);
  return orRefusal(() => saveTripStyle(access, null));
}

export async function saveNightsForm(tripId: number, formData: FormData): Promise<Result> {
  const access = await requireTripAccess(tripId);
  const raw = String(formData.get("nights") ?? "").trim();
  return orRefusal(() => saveTripNights(access, raw ? Number(raw) : null));
}

export async function saveHomeAirportForm(formData: FormData): Promise<Result> {
  const viewer = await requireUser();
  const raw = String(formData.get("airport") ?? "").trim();
  return orRefusal(() => saveTravelProfile(viewer.id, { homeAirport: raw || null }));
}

export async function saveTravelStyleForm(formData: FormData): Promise<Result> {
  const viewer = await requireUser();
  const [cabin, stay, pace] = [formData.get("cabin"), formData.get("stay"), formData.get("pace")];
  return orRefusal(() =>
    saveTravelProfile(viewer.id, {
      ...(isCabin(cabin) && { cabin }),
      ...(isStayStyle(stay) && { stay }),
      ...(isPace(pace) && { pace }),
    }),
  );
}
