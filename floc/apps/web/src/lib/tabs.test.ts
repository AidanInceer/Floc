import { describe, expect, it } from "vitest";

import { TABS, TRIP_TAB_CLUSTERS } from "./tabs";

describe("TRIP_TAB_CLUSTERS", () => {
  it("groups the trip tabs as the account bar does: the hub, when, what it costs and carries, what it holds", () => {
    expect(TRIP_TAB_CLUSTERS.map((cluster) => cluster.map((tab) => tab.key))).toEqual([
      ["overview"],
      ["dates", "days"],
      ["money", "packing"],
      ["notes", "files"],
    ]);
  });

  it("keeps every trip tab in one cluster, in the order of the tab row", () => {
    expect(TRIP_TAB_CLUSTERS.flat()).toEqual(TABS);
  });
});
