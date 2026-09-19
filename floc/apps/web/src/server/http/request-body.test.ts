import { describe, expect, it } from "vitest";

import { boundedRequest } from "./request-body";

describe("bounded request bodies", () => {
  it("preserves JSON and headers", async () => {
    const req = new Request("http://localhost/api/trpc/me.rename", {
      method: "POST", headers: { "content-type": "application/json", cookie: "session=test" },
      body: JSON.stringify({ displayName: "Zoë" }),
    });
    const bounded = await boundedRequest(req);
    expect(await bounded!.json()).toEqual({ displayName: "Zoë" });
    expect(bounded!.headers.get("cookie")).toBe("session=test");
  });

  it("allows exactly 12 MB of request bytes", async () => {
    const req = new Request("http://localhost/api/trpc/files.upload", {
      method: "POST", body: new Uint8Array(12 * 1024 * 1024),
    });
    const bounded = await boundedRequest(req);
    expect((await bounded!.arrayBuffer()).byteLength).toBe(12 * 1024 * 1024);
  });

  it("keeps a bodyless GET intact", async () => {
    const req = new Request("http://localhost/api/trpc/health");
    expect(await boundedRequest(req)).toBe(req);
  });

  it("propagates interrupted reads", async () => {
    const req = new Request("http://localhost/api/trpc/files.upload", {
      method: "POST", duplex: "half",
      body: new ReadableStream({ start(controller) { controller.error(new Error("Disconnected")); } }),
    } as RequestInit);
    await expect(boundedRequest(req)).rejects.toThrow("Disconnected");
  });
});
