import type { ListingRates } from "@floc/core/trip/explore/listing-price";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/lib/api";

/** The rates Explore's prices are shown with, from the same cached `explore.get` the list reads. */
export function useListingRates(): ListingRates | null {
  return useQuery(trpc.explore.get.queryOptions()).data?.rates ?? null;
}
