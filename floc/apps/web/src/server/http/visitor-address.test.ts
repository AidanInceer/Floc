import type { IncomingMessage, ServerResponse } from "node:http";

import { describe, expect, it, vi } from "vitest";

import { fromCloudflare, visitorAddress, withVisitorAddress } from "./visitor-address";

describe("the visitor's address behind an edge", () => {
  it("is the connecting address when no edge is in front", () => {
    expect(visitorAddress({ realIp: "203.0.113.9", edgeIp: "198.51.100.4", edge: undefined })).toBe("203.0.113.9");
  });

  it("is the address Cloudflare names when the request came through Cloudflare", () => {
    expect(visitorAddress({ realIp: "172.64.1.1", edgeIp: "198.51.100.4", edge: "cloudflare" })).toBe("198.51.100.4");
    expect(visitorAddress({ realIp: "2606:4700:10::1", edgeIp: "2001:db8::5", edge: "cloudflare" })).toBe("2001:db8::5");
  });

  it("never believes the edge header from a caller that is not Cloudflare", () => {
    expect(visitorAddress({ realIp: "203.0.113.9", edgeIp: "198.51.100.4", edge: "cloudflare" })).toBe("203.0.113.9");
  });

  it("keeps the connecting address when Cloudflare sends no visitor", () => {
    expect(visitorAddress({ realIp: "172.64.1.1", edgeIp: undefined, edge: "cloudflare" })).toBe("172.64.1.1");
  });

  it("knows Cloudflare's own ranges, and only those", () => {
    expect(fromCloudflare("104.16.0.1")).toBe(true);
    expect(fromCloudflare("104.23.255.255")).toBe(true);
    expect(fromCloudflare("104.32.0.1")).toBe(false);
    expect(fromCloudflare("::ffff:162.158.10.10")).toBe(true);
    expect(fromCloudflare("2a06:98c7::1")).toBe(true);
    expect(fromCloudflare("2a06:98c8::1")).toBe(false);
    expect(fromCloudflare("not an address")).toBe(false);
  });

  it("gives two visitors behind Cloudflare their own address on the request", () => {
    const seen: unknown[] = [];
    const gate = withVisitorAddress((req) => seen.push(req.headers["x-real-ip"]), "cloudflare");
    for (const visitor of ["198.51.100.4", "198.51.100.5"]) {
      const req = { headers: { "x-real-ip": "172.64.1.1", "cf-connecting-ip": visitor } } as unknown as IncomingMessage;
      gate(req, {} as ServerResponse);
    }
    expect(seen).toEqual(["198.51.100.4", "198.51.100.5"]);
  });

  it("leaves a request alone when no edge is set", () => {
    const handle = vi.fn();
    const req = { headers: { "x-real-ip": "203.0.113.9", "cf-connecting-ip": "198.51.100.4" } } as unknown as IncomingMessage;
    withVisitorAddress(handle, undefined)(req, {} as ServerResponse);
    expect(req.headers["x-real-ip"]).toBe("203.0.113.9");
    expect(handle).toHaveBeenCalledOnce();
  });
});
