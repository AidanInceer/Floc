import { DEFAULT_EXPLORE_SORT, type ExploreSort } from "@floc/core/trip/explore/explore-sort";
import type { Region } from "@floc/core/trip/explore/preset-trips";

export function exploreHref({ region, sort, showAll }: { region: Region | null; sort: ExploreSort; showAll: boolean }): string {
  const query = new URLSearchParams();
  if (region) query.set("region", region);
  if (sort !== DEFAULT_EXPLORE_SORT) query.set("sort", sort);
  if (showAll) query.set("all", "1");
  const q = query.toString();
  return q ? `/explore?${q}` : "/explore";
}
