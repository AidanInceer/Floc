import { afterEach, describe, expect, it, vi } from "vitest";

import { mintViewToken, viewTokenHolds } from "@/server/documents/view-link";
import { mintCalendarToken, readCalendarToken } from "@/server/itinerary/feed/calendar-link";

import { linkKey } from "./link-key";

afterEach(() => vi.unstubAllEnvs());

describe("the key a signed link is made with (#582)", () => {
  it("is the session secret until that kind of link has its own", () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "session-secret");
    expect(linkKey("file-view")).toBe("session-secret");
  });

  it("is the link's own secret once one is set", () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "session-secret");
    vi.stubEnv("FLOC_CALENDAR_LINK_SECRET", "calendar-secret");
    expect(linkKey("calendar-feed")).toBe("calendar-secret");
    expect(linkKey("file-view")).toBe("session-secret");
  });

  it("lets the session secret rotate without ending a calendar feed that has its own key", () => {
    vi.stubEnv("FLOC_CALENDAR_LINK_SECRET", "calendar-secret");
    vi.stubEnv("BETTER_AUTH_SECRET", "before");
    const token = mintCalendarToken(7, "u1", 0);
    vi.stubEnv("BETTER_AUTH_SECRET", "after");
    expect(readCalendarToken(token)).toEqual({ tripId: 7, userId: "u1", epoch: 0 });
  });

  it("ends every file link, and nothing else, when the file link secret changes", () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "session-secret");
    vi.stubEnv("FLOC_FILE_LINK_SECRET", "one");
    const file = mintViewToken(3);
    const feed = mintCalendarToken(7, "u1", 0);
    vi.stubEnv("FLOC_FILE_LINK_SECRET", "two");
    expect(viewTokenHolds(file, 3)).toBe(false);
    expect(readCalendarToken(feed)).not.toBeNull();
  });
});
