"use server";

import { requireTripAccess, requireUser } from "@/server/access";
import { homeCurrenciesFor } from "@/server/auth/profile";
import {
  saveBudget,
  saveOwnLine,
  saveTravelProfile,
  saveTripNights,
  saveTripStyle,
} from "@/server/money/estimate/estimate-save";
import { isRefusal, Refusal } from "@floc/core/errors/refusal";
import type { Currency } from "@floc/core/money/currency";
import { isEstimateLine } from "@floc/core/money/estimate/lines";
import { isCabin, isPace, isStayStyle } from "@floc/core/money/estimate/style";
import { parseMoney } from "@floc/core/money/money";

type Result = { error?: string };

async function answer(run: () => Promise<void>): Promise<Result> {
  try {
    await run();
    return {};
  } catch (error) {
    if (isRefusal(error)) return { error: error.message };
    throw error;
  }
}

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
  return answer(async () => saveBudget(access, amount(formData.get("amount"), await homeOf(access.viewer.id))));
}

export async function saveLineForm(tripId: number, formData: FormData): Promise<Result> {
  const access = await requireTripAccess(tripId);
  return answer(async () => {
    const line = formData.get("line");
    if (!isEstimateLine(line)) throw new Refusal("That line is not part of the estimate.");
    const currency = await homeOf(access.viewer.id);
    await saveOwnLine(access, line, {
      ...(formData.has("figure") && { figure: amount(formData.get("figure"), currency) }),
      ...(formData.has("budget") && { budget: amount(formData.get("budget"), currency) }),
    });
  });
}

export async function saveStyleForm(tripId: number, formData: FormData): Promise<Result> {
  const access = await requireTripAccess(tripId);
  const [cabin, stay, pace] = [formData.get("cabin"), formData.get("stay"), formData.get("pace")];
  return answer(() =>
    saveTripStyle(access, {
      ...(isCabin(cabin) && { cabin }),
      ...(isStayStyle(stay) && { stay }),
      ...(isPace(pace) && { pace }),
    }),
  );
}

export async function resetTripStyle(tripId: number): Promise<Result> {
  const access = await requireTripAccess(tripId);
  return answer(() => saveTripStyle(access, null));
}

export async function saveNightsForm(tripId: number, formData: FormData): Promise<Result> {
  const access = await requireTripAccess(tripId);
  const raw = String(formData.get("nights") ?? "").trim();
  return answer(() => saveTripNights(access, raw ? Number(raw) : null));
}

export async function saveHomeAirportForm(formData: FormData): Promise<Result> {
  const viewer = await requireUser();
  const raw = String(formData.get("airport") ?? "").trim();
  return answer(() => saveTravelProfile(viewer.id, { homeAirport: raw || null }));
}

export async function saveTravelStyleForm(formData: FormData): Promise<Result> {
  const viewer = await requireUser();
  const [cabin, stay, pace] = [formData.get("cabin"), formData.get("stay"), formData.get("pace")];
  return answer(() =>
    saveTravelProfile(viewer.id, {
      ...(isCabin(cabin) && { cabin }),
      ...(isStayStyle(stay) && { stay }),
      ...(isPace(pace) && { pace }),
    }),
  );
}
