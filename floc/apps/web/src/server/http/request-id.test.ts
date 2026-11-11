import { describe, expect, it, vi } from "vitest";

import type { IncomingMessage, ServerResponse } from "node:http";
import { capturedLog } from "@/test/captured-log";

import { currentRequestId } from "../observability/request-context";

import { withRequestId } from "./request-id";

function request(headers: Record<string, string> = {}): IncomingMessage {
  return { method: "GET", url: "/trip/1?x=1", headers } as unknown as IncomingMessage;
}

function response() {
  const listeners: Record<string, () => void> = {};
  return {
    statusCode: 200,
    setHeader: vi.fn(),
    once: vi.fn((event: string, run: () => void) => (listeners[event] = run)),
    finish: () => listeners.finish?.(),
  };
}

describe("withRequestId", () => {
  it("runs the handler inside the edge's request id and sends it back", () => {
    let seen: string | undefined;
    const res = response();
    withRequestId(() => (seen = currentRequestId()))(request({ "x-railway-request-id": "Kc2wQ-9xT_aB3dEf" }), res as unknown as ServerResponse);
    expect(seen).toBe("Kc2wQ-9xT_aB3dEf");
    expect(res.setHeader).toHaveBeenCalledWith("X-Request-Id", "Kc2wQ-9xT_aB3dEf");
  });

  it("makes an id when the edge sends none", () => {
    let seen: string | undefined;
    withRequestId(() => (seen = currentRequestId()))(request(), response() as unknown as ServerResponse);
    expect(seen).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("logs a slow request with its route pattern, status and time", () => {
    let now = 1_000;
    const res = response();
    const lines = capturedLog(() => {
      withRequestId(() => undefined, () => now)(request(), res as unknown as ServerResponse);
      now += 2_500;
      res.statusCode = 500;
      res.finish();
    });
    expect(lines).toEqual([
      expect.objectContaining({ message: "request.slow", level: "warn", route: "/trip/[id]", method: "GET", status: 500, ms: 2500, requestId: expect.any(String) }),
    ]);
  });

  it("writes nothing for a quick request", () => {
    const res = response();
    const lines = capturedLog(() => {
      withRequestId(() => undefined, () => 0)(request(), res as unknown as ServerResponse);
      res.finish();
    });
    expect(lines).toEqual([]);
  });
});
