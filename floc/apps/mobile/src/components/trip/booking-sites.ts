import { DEFAULT_BOOKING_SITES, toggleSite, type BookingSite, type BookingSites, type SiteKind } from "@floc/core/trip/booking-sites";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { trpc } from "@/lib/api";

/** Your booking sites, shared through the settings query so every row on every screen moves together. */
export function useBookingSites(): { sites: BookingSites; toggle: (kind: SiteKind, site: BookingSite) => void } {
  const queryClient = useQueryClient();
  const key = trpc.settings.get.queryKey();
  const settings = useQuery(trpc.settings.get.queryOptions());
  const sites = settings.data?.bookingSites ?? DEFAULT_BOOKING_SITES;
  const save = useMutation({
    ...trpc.settings.bookingSite.mutationOptions(),
    onSuccess: (stands) => queryClient.setQueryData(key, (old) => (old ? { ...old, bookingSites: stands } : old)),
    onError: () => void queryClient.invalidateQueries({ queryKey: key }),
  });

  const toggle = (kind: SiteKind, site: BookingSite) => {
    const next = toggleSite(sites, kind, site);
    if (next === sites) return;
    // Why: the tick shows at once; the server's answer replaces it when it lands.
    queryClient.setQueryData(key, (old) => (old ? { ...old, bookingSites: next } : old));
    save.mutate(kind === "flights" ? { kind, site: site as BookingSites["flights"][number] } : { kind, site: site as BookingSites["stays"][number] });
  };

  return { sites, toggle };
}
