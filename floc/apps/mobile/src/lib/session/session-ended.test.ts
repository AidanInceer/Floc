import { beforeEach, describe, expect, it, vi } from "vitest";

import { isUnauthorized, onSessionEnded, reportSessionEnded, sessionClosed, sessionResumed, takeEndedNotice } from "./session-ended";

beforeEach(() => {
  sessionClosed();
  takeEndedNotice();
});

describe("a session the server no longer accepts", () => {
  it("recognises a tRPC 401", () => {
    expect(isUnauthorized({ data: { code: "UNAUTHORIZED", httpStatus: 401 } })).toBe(true);
  });

  it("does not treat other failures as signed out", () => {
    expect(isUnauthorized({ data: { code: "NOT_FOUND", httpStatus: 404 } })).toBe(false);
    expect(isUnauthorized(new Error("Network request failed"))).toBe(false);
    expect(isUnauthorized(null)).toBe(false);
  });

  it("tells the listener once, however many reads fail together", () => {
    const listener = vi.fn();
    const stop = onSessionEnded(listener);
    sessionResumed();
    reportSessionEnded();
    reportSessionEnded();
    expect(listener).toHaveBeenCalledTimes(1);
    stop();
  });

  it("leaves a notice for the sign-in screen, read once", () => {
    sessionResumed();
    reportSessionEnded();
    expect(takeEndedNotice()).toBe(true);
    expect(takeEndedNotice()).toBe(false);
  });

  it("stays quiet about a late refusal after you signed out yourself", () => {
    const listener = vi.fn();
    const stop = onSessionEnded(listener);
    sessionResumed();
    sessionClosed();
    reportSessionEnded();
    expect(listener).not.toHaveBeenCalled();
    expect(takeEndedNotice()).toBe(false);
    stop();
  });
});
