import type { Currency } from "@floc/core/money/currency";
import { guessCurrency } from "@floc/core/money/local-currency";
import type { ListingRates } from "@floc/core/trip/explore/listing-price";

import { homeCurrenciesFor } from "@/server/auth/profile";
import { getHomeRates } from "@/server/money/fx";

/** The currency prices are shown in: a member's own, else a guest's guessed from the request, else pounds. Nothing is stored. */
export async function viewerCurrency(userId: string | null, request: Headers): Promise<Currency> {
  if (userId) return (await homeCurrenciesFor([userId])).get(userId) ?? "GBP";
  return guessCurrency({
    country: request.get("cf-ipcountry") ?? request.get("x-vercel-ip-country"),
    acceptLanguage: request.get("accept-language"),
  });
}

export async function listingRates(currency: Currency): Promise<ListingRates | null> {
  const rates = await getHomeRates(currency);
  return rates && { home: rates.home, toHome: rates.toHome };
}
