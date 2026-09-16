import "server-only";

import type { FlocPort } from "@floc/api/port";

import { refresh } from "@/server/freshness";
import { loadExploreRates } from "@/server/explore/explore-rates";
import { loadAnswers, saveAnswers } from "@/server/explore/explore-answers";
import { listSaved, setSaved } from "@/server/explore/shortlist";

type ExplorePort = Pick<FlocPort, "loadExplore" | "setExploreSaved" | "setExploreAnswers" | "loadExploreRates">;

export const explorePort: ExplorePort = {
  async loadExplore(viewerId) {
    const [saved, answers] = await Promise.all([listSaved(viewerId), loadAnswers(viewerId)]);
    return { saved, answers };
  },

  async setExploreSaved(viewerId, presetId, saved) {
    const result = await setSaved(viewerId, presetId, saved);
    refresh({ kind: "explore" });
    return result;
  },

  async setExploreAnswers(viewerId, answers) {
    await saveAnswers(viewerId, answers);
    refresh({ kind: "explore" });
  },

  loadExploreRates(viewerId) {
    return loadExploreRates(viewerId);
  },
};
