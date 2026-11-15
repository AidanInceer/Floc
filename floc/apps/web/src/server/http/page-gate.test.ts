import type { IncomingMessage, ServerResponse } from "node:http";

import { describe, expect, it, vi } from "vitest";

import { isLimitedRead, limitReads } from "./page-gate";
import { writeLimiter } from "./write-limiter";

function request(method: string, url: string, realIp?: string): IncomingMessage {
  return { method, url, headers: realIp ? { "x-real-ip": realIp } : {}, socket: { remoteAddress: "127.0.0.1" } } as unknown as IncomingMessage;
}

function response() {
  return { writeHead: vi.fn(), end: vi.fn() };
}

describe("the page gate", () => {
  it("answers 429 with a wait to one address that floods page loads", () => {
    const handle = vi.fn();
    const gate = limitReads(handle, writeLimiter({ capacity: 2, perSecond: 0.001 }));
    const answers = [1, 2, 3, 4].map(() => {
      const res = response();
      gate(request("GET", "/explore", "203.0.113.9"), res as unknown as ServerResponse);
      return res;
    });
    expect(handle).toHaveBeenCalledTimes(2);
    expect(answers[3].writeHead).toHaveBeenCalledWith(429, expect.objectContaining({ "Retry-After": "10" }));
    expect(answers[3].end).toHaveBeenCalledWith("Too many requests at once. Wait a moment and try again.");
  });

  it("keeps serving another visitor while one is refused", () => {
    const handle = vi.fn();
    const gate = limitReads(handle, writeLimiter({ capacity: 1, perSecond: 0.001 }));
    for (let i = 0; i < 5; i++) gate(request("GET", "/", "203.0.113.9"), response() as unknown as ServerResponse);
    const res = response();
    gate(request("GET", "/", "198.51.100.4"), res as unknown as ServerResponse);
    expect(res.writeHead).not.toHaveBeenCalled();
    expect(handle).toHaveBeenCalledTimes(2);
  });

  it("never limits this machine's own calls, or a write", () => {
    const handle = vi.fn();
    const gate = limitReads(handle, writeLimiter({ capacity: 1 }));
    for (let i = 0; i < 3; i++) {
      gate(request("GET", "/trips"), response() as unknown as ServerResponse);
      gate(request("POST", "/trips", "203.0.113.9"), response() as unknown as ServerResponse);
    }
    expect(handle).toHaveBeenCalledTimes(6);
  });

  it("counts pages, data and images, and leaves built files and machine calls alone", () => {
    expect(isLimitedRead("GET", "/")).toBe(true);
    expect(isLimitedRead("HEAD", "/explore?region=asia")).toBe(true);
    expect(isLimitedRead("GET", "/api/trpc/trips.list")).toBe(true);
    expect(isLimitedRead("GET", "/_next/image?url=%2Ffloc-hero.png")).toBe(true);
    expect(isLimitedRead("GET", "/_next/static/chunks/main.js")).toBe(false);
    expect(isLimitedRead("GET", "/api/health")).toBe(false);
    expect(isLimitedRead("GET", "/api/auth/get-session")).toBe(false);
    expect(isLimitedRead("GET", "/api/cron/push")).toBe(false);
    expect(isLimitedRead("POST", "/explore")).toBe(false);
    expect(isLimitedRead(undefined, undefined)).toBe(false);
  });
});
