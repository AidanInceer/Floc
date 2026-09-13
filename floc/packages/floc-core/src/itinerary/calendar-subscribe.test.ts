import { describe, expect, it } from "vitest";

import { subscribeUrl } from "./calendar-subscribe";

const feed = "https://floc.example/calendar/abc.def.ics";

describe("subscribing a phone's calendar to a trip", () => {
  it("hands an iPhone a webcal address, which its calendar subscribes to", () => {
    expect(subscribeUrl(feed, "ios")).toBe("webcal://floc.example/calendar/abc.def.ics");
  });

  it("hands Android to Google Calendar's add-by-address page", () => {
    expect(subscribeUrl(feed, "android")).toBe(
      `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(
        "webcal://floc.example/calendar/abc.def.ics",
      )}`,
    );
  });

  it("turns a plain http address into webcal too", () => {
    expect(subscribeUrl("http://localhost:3000/calendar/t.ics", "ios")).toBe(
      "webcal://localhost:3000/calendar/t.ics",
    );
  });
});
