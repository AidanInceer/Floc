import { afterEach, describe, expect, it, vi } from "vitest";

import { listPrimaryEvents, revokeGoogleToken } from "@/server/calendar/google-calendar";

const fetchMock = vi.fn();
const range = { start: "2027-09-04", end: "2027-09-08" };

function timedOut(): Promise<never> {
  return Promise.reject(new DOMException("The operation was aborted due to timeout", "TimeoutError"));
}

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("Google Calendar calls", () => {
  it("reading events gives up after a fixed time instead of holding the request open", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockImplementation(timedOut);

    await expect(listPrimaryEvents("token", range)).resolves.toEqual({ ok: false, reason: "failed" });
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it("revoking access gives up after a fixed time and reports it did not revoke", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockImplementation(timedOut);

    await expect(revokeGoogleToken("token")).resolves.toBe(false);
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });
});
