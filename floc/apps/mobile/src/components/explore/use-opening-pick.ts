import { openingPick, openingPool } from "@floc/core/trip/explore/finder/opening-pick";
import { comingSeason } from "@floc/core/trip/explore/finder/season-picks";
import type { TripTag } from "@floc/core/trip/explore/finder/tag-groups";
import { useEffect, useRef } from "react";

import { MAP_PICKS } from "./explore-map";

export function useOpeningPick(likes: TripTag[] | undefined, saved: string[] | undefined, pick: (id: string) => void) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !likes || !saved) return;
    done.current = true;
    const season = comingSeason(new Date().getUTCMonth() + 1);
    pick(openingPick(openingPool(MAP_PICKS, season, { saved, likes }), (Date.now() % 1000) / 1000).id);
  }, [likes, saved, pick]);
}
