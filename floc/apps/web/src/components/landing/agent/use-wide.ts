"use client";

import { useSyncExternalStore } from "react";

// Why: below this the six cards and their lines no longer fit beside the prompt, so the lanes take over. Matches `min-[1200px]:` in the scene.
const WIDE = "(min-width: 1200px)";

const subscribe = (change: () => void) => {
  const query = matchMedia(WIDE);
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
};

/** True when the scene plays as marked cards rather than lanes. False on the server. */
export function useWide() {
  return useSyncExternalStore(subscribe, () => matchMedia(WIDE).matches, () => false);
}
