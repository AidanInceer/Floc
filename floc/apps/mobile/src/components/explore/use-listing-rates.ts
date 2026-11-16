import type { ListingRates } from "@floc/core/trip/explore/listing-price";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/lib/api";

export function useListingRates(): ListingRates | null {
  return useQuery(trpc.explore.get.queryOptions()).data?.rates ?? null;
}
