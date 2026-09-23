import "server-only";

import type { FlocPort } from "@floc/api/port";

import { refresh } from "@/server/freshness";
import { loadExploreRates } from "@/server/explore/explore-rates";
import { loadAnswers, saveAnswers } from "@/server/explore/explore-answers";

type ExplorePort = Pick<FlocPort, "loadExplore" | "setExploreAnswers" | "loadExploreRates">;

export const explorePort: ExplorePort = {
  async loadExplore(viewerId) {
    return { answers: await loadAnswers(viewerId) };
  },

  async setExploreAnswers(viewerId, answers) {
    await saveAnswers(viewerId, answers);
    refresh({ kind: "explore" });
  },

  loadExploreRates(viewerId) {
    return loadExploreRates(viewerId);
  },
};
