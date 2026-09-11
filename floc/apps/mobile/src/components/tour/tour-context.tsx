/**
 * Where the first-trip tour's targets live (#315). The rail is in the trip's
 * header and the roster is on Overview, so they register here instead of being
 * passed down two separate trees.
 */
import type { TourStopKey } from "@floc/core/trip/tour";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { View } from "react-native";

type TourTargets = {
  targets: React.RefObject<Map<TourStopKey, View>>;
  active: TourStopKey | null;
  setActive: (key: TourStopKey | null) => void;
};

const TourContext = createContext<TourTargets | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const targets = useRef(new Map<TourStopKey, View>());
  const [active, setActive] = useState<TourStopKey | null>(null);
  const value = useMemo(() => ({ targets, active, setActive }), [active]);
  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour(): TourTargets | null {
  return useContext(TourContext);
}

/** A ref that marks a view as a tour stop. Does nothing outside a trip. */
export function useTourTarget(key: TourStopKey | null) {
  const tour = useContext(TourContext);
  const targets = tour?.targets;
  return useCallback(
    (node: View | null) => {
      if (!targets?.current || !key) return;
      if (node) targets.current.set(key, node);
      else targets.current.delete(key);
    },
    [targets, key],
  );
}
