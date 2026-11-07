"use client";

import { createContext, useContext, useRef, useState, useTransition, type ReactNode } from "react";

import { toggleSite, type BookingSite, type BookingSites, type SiteKind } from "@floc/core/trip/booking/booking-sites";
import { toggleBookingSiteAction } from "@/app/settings/actions";

type Shared = {
  sites: BookingSites;
  /** The site just added, so its new buttons can wash once. */
  fresh: BookingSite | null;
  toggle: (kind: SiteKind, site: BookingSite) => void;
};

const SitesContext = createContext<Shared | null>(null);

const FRESH_MS = 1800;

/** One choice for every row on the page: a tick in one menu changes them all at once. */
export function BookingSitesProvider({ initial, children }: { initial: BookingSites; children: ReactNode }) {
  const [sites, setSites] = useState(initial);
  const [fresh, setFresh] = useState<BookingSite | null>(null);
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const toggle = (kind: SiteKind, site: BookingSite) => {
    const next = toggleSite(sites, kind, site);
    if (next === sites) return;
    setSites(next);
    if (!(sites[kind] as string[]).includes(site)) {
      setFresh(site);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setFresh(null), FRESH_MS);
    }
    // Why: the server's answer wins, so a refused write puts the row back.
    startTransition(async () => setSites(await toggleBookingSiteAction(kind, site)));
  };

  return <SitesContext.Provider value={{ sites, fresh, toggle }}>{children}</SitesContext.Provider>;
}

export function useBookingSites(): Shared {
  const shared = useContext(SitesContext);
  if (!shared) throw new Error("useBookingSites needs a BookingSitesProvider above it.");
  return shared;
}
