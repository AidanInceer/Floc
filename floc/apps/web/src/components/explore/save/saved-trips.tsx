"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

type SavedTrips = { ids: ReadonlySet<string>; signedIn: boolean };

const Context = createContext<SavedTrips>({ ids: new Set(), signedIn: false });

/** The viewer's saved Explore trips, read once on the server, for every heart on the page (#467). */
export function SavedTripsProvider({ ids, signedIn, children }: { ids: string[]; signedIn: boolean; children: ReactNode }) {
  const value = useMemo(() => ({ ids: new Set(ids), signedIn }), [ids, signedIn]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useSavedTrips = () => useContext(Context);
