import { describe, expect, it } from "vitest";

import { POST } from "./route";

describe("API request limits", () => {
  it.each([null, "1"])("counts streamed bytes with content-length %s", async (length) => {
    let chunks = 0;
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        chunks++;
        controller.enqueue(new Uint8Array(1024 * 1024));
      },
      cancel() { cancelled = true; },
    }, { highWaterMark: 0 });
    const headers = new Headers({ "content-type": "application/json" });
    if (length) headers.set("content-length", length);

    const res = await POST(new Request("http://localhost/api/trpc/files.upload", {
      method: "POST", headers, body, duplex: "half",
    } as RequestInit));

    expect(res.status).toBe(413);
    expect(chunks).toBe(13);
    expect(cancelled).toBe(true);
  });

  it("refuses an oversized body before parsing JSON or checking the session", async () => {
    let read = false;
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      pull() { read = true; },
      cancel() { cancelled = true; },
    }, { highWaterMark: 0 });
    const req = new Request("http://localhost/api/trpc/files.upload", {
      method: "POST",
      headers: { "content-type": "application/json", "content-length": String(13 * 1024 * 1024) },
      body,
      duplex: "half",
    } as RequestInit);

    const res = await POST(req);

    expect(res.status).toBe(413);
    expect(read).toBe(false);
    expect(cancelled).toBe(true);
  });
});
