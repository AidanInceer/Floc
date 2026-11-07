import type { IncomingMessage, ServerResponse } from "node:http";

import { describe, expect, it, vi } from "vitest";

import { limitWrites } from "./write-gate";
import { writeLimiter } from "./write-limiter";

function request(method: string, url: string, realIp?: string): IncomingMessage {
  return { method, url, headers: realIp ? { "x-real-ip": realIp } : {}, socket: { remoteAddress: "127.0.0.1" } } as unknown as IncomingMessage;
}

function response() {
  return { writeHead: vi.fn(), end: vi.fn() };
}

describe("the write gate", () => {
  it("hands a write under the limit to Next", () => {
    const handle = vi.fn();
    const gate = limitWrites(handle, writeLimiter({ capacity: 1 }));
    const res = response();
    gate(request("POST", "/trip/1", "203.0.113.9"), res as unknown as ServerResponse);
    expect(handle).toHaveBeenCalledOnce();
    expect(res.writeHead).not.toHaveBeenCalled();
  });

  it("answers 429 with a wait to a caller past the limit", () => {
    const handle = vi.fn();
    const gate = limitWrites(handle, writeLimiter({ capacity: 1 }));
    gate(request("POST", "/trip/1", "203.0.113.9"), response() as unknown as ServerResponse);
    const res = response();
    gate(request("POST", "/trip/1", "203.0.113.9"), res as unknown as ServerResponse);
    expect(handle).toHaveBeenCalledOnce();
    expect(res.writeHead).toHaveBeenCalledWith(429, expect.objectContaining({ "Retry-After": "30" }));
    expect(res.end).toHaveBeenCalledWith("Too many changes at once. Wait a moment and try again.");
  });

  it("never limits reads or this machine's own calls", () => {
    const handle = vi.fn();
    const gate = limitWrites(handle, writeLimiter({ capacity: 1 }));
    for (let i = 0; i < 3; i++) {
      gate(request("GET", "/trip/1", "203.0.113.9"), response() as unknown as ServerResponse);
      gate(request("POST", "/trip/1"), response() as unknown as ServerResponse);
    }
    expect(handle).toHaveBeenCalledTimes(6);
  });
});
