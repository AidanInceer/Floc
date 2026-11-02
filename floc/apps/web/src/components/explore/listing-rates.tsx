"use client";

import type { ListingRates } from "@floc/core/trip/explore/listing-price";
import { createContext, useContext, type ReactNode } from "react";

const Rates = createContext<ListingRates | null>(null);

export function ListingRatesProvider({ rates, children }: { rates: ListingRates | null; children: ReactNode }) {
  return <Rates.Provider value={rates}>{children}</Rates.Provider>;
}

export const useListingRates = () => useContext(Rates);
