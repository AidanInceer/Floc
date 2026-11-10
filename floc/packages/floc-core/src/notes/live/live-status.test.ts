import { describe, expect, it } from "vitest";

import { liveStatus } from "./live-status";

const base = { connected: true, synced: true, unsynced: 0, failed: false };

describe("liveStatus", () => {
  it("is live when synced with nothing waiting", () => {
    expect(liveStatus(base)).toBe("live");
  });

  it("is saving while changes wait on the server", () => {
    expect(liveStatus({ ...base, unsynced: 2 })).toBe("saving");
  });

  it("is opening while the first sync runs with nothing typed", () => {
    expect(liveStatus({ ...base, synced: false })).toBe("opening");
  });

  it("is saving when something was typed before the first sync ended", () => {
    expect(liveStatus({ ...base, synced: false, unsynced: 1 })).toBe("saving");
  });

  it("is offline with changes kept when the socket is down", () => {
    expect(liveStatus({ ...base, connected: false, unsynced: 3 })).toBe("offline");
  });

  it("is offline when the server refused the connection", () => {
    expect(liveStatus({ ...base, failed: true })).toBe("offline");
  });
});
