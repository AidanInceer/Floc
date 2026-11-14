import { describe, expect, it } from "vitest";

import { ACCOUNT_CLUSTERS, accountTabCounts } from "./account-tabs";

describe("ACCOUNT_CLUSTERS", () => {
  it("holds every account page on one level: you, your people, what you keep, your bookings", () => {
    expect(ACCOUNT_CLUSTERS.map((cluster) => cluster.map((tab) => tab.key))).toEqual([
      ["profile"],
      ["friends", "groups"],
      ["saved", "wish", "packing"],
      ["bookings"],
    ]);
  });

  it("gives Groups a page of its own under Friends", () => {
    const groups = ACCOUNT_CLUSTERS.flat().find((tab) => tab.key === "groups");
    expect(groups?.href).toBe("/friends/groups");
  });

  it("links each tab to one page", () => {
    const hrefs = ACCOUNT_CLUSTERS.flat().map((tab) => tab.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

describe("accountTabCounts", () => {
  it("puts friend requests on Friends and waiting bookings on Bookings", () => {
    expect(accountTabCounts({ friendRequestCount: 1, bookingCount: 2 })).toEqual({ friends: 1, bookings: 2 });
  });

  it("leaves a tab with nothing waiting out", () => {
    expect(accountTabCounts({ friendRequestCount: 0, bookingCount: 3 })).toEqual({ bookings: 3 });
  });
});
