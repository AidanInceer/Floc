import "server-only";

import type { FlocPort } from "@floc/api/port";

import { refresh } from "@/server/freshness";
import { loadFinder, saveFinder } from "@/server/explore/explore-finder";

type ExplorePort = Pick<FlocPort, "loadExplore" | "setExploreFinder">;

export const explorePort: ExplorePort = {
  async loadExplore(viewerId) {
    return { finder: await loadFinder(viewerId) };
  },

  async setExploreFinder(viewerId, finder) {
    await saveFinder(viewerId, finder);
    refresh({ kind: "explore" });
  },
};
