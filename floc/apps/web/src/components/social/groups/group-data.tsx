"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import type { Group, PastTrip } from "@/server/social/groups";
import type { Person } from "@/server/social/friends";

type GroupData = {
  friends: Person[];
  groups: Group[];
  pastTrips: PastTrip[];
  isFriend: (id: string) => boolean;
};

const GroupDataContext = createContext<GroupData | null>(null);

export function GroupDataProvider({
  friends,
  groups,
  pastTrips,
  children,
}: {
  friends: Person[];
  groups: Group[];
  pastTrips: PastTrip[];
  children: ReactNode;
}) {
  const value = useMemo(() => {
    const ids = new Set(friends.map((f) => f.id));
    return { friends, groups, pastTrips, isFriend: (id: string) => ids.has(id) };
  }, [friends, groups, pastTrips]);
  return <GroupDataContext.Provider value={value}>{children}</GroupDataContext.Provider>;
}

export function useGroupData(): GroupData {
  const data = useContext(GroupDataContext);
  if (!data) throw new Error("useGroupData needs a GroupDataProvider");
  return data;
}
