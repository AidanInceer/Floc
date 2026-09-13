import { describe, expect, it } from "vitest";

import { phoneRoute, threadTab, tripHref } from "./notification-href";

describe("notification links", () => {
  it("opens the tab a comment is drawn on", () => {
    expect(tripHref(4, threadTab("day_event"))).toBe("/trip/4/days");
    expect(tripHref(4, threadTab("day"))).toBe("/trip/4/days");
    expect(tripHref(4, threadTab("expense"))).toBe("/trip/4/money");
    expect(tripHref(4, threadTab("trip"))).toBe("/trip/4/overview");
  });

  it("sends the phone to its own Overview route", () => {
    expect(phoneRoute("/trip/4/overview")).toBe("/trip/4");
    expect(phoneRoute("/trip/4/money")).toBe("/trip/4/money");
    expect(phoneRoute("/friends")).toBe("/friends");
  });
});
