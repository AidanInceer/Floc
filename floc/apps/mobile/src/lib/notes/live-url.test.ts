import { describe, expect, it } from "vitest";

import { liveNotesUrl } from "./live-url";

describe("the live Notes address", () => {
  it("swaps http for ws and https for wss", () => {
    expect(liveNotesUrl("http://localhost:3000")).toBe("ws://localhost:3000/live/notes");
    expect(liveNotesUrl("https://floc.app")).toBe("wss://floc.app/live/notes");
  });
});
