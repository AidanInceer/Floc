import { describe, expect, it } from "vitest";
import { publishReel, readInstagramConfig, type Transport } from "./instagram.ts";

const config = { userId: "17841", token: "secret-token", version: "v23.0" };

interface Call { url: string; method: string; headers: Record<string, string>; body: unknown }

function fakeTransport(statuses: string[], overrides: Record<string, unknown> = {}) {
  const calls: Call[] = [];
  const queue = [...statuses];
  const reply = (body: unknown, ok = true) => Promise.resolve(new Response(JSON.stringify(body), { status: ok ? 200 : 400 }));
  const transport: Transport = {
    sleep: () => Promise.resolve(),
    fetch: (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method ?? "GET";
      calls.push({ url, method, headers: Object.fromEntries(new Headers(init?.headers).entries()), body: init?.body });
      const key = Object.keys(overrides).find((k) => url.includes(k));
      if (key) return reply(overrides[key], false);
      if (url.endsWith("/17841/media")) return reply({ id: "C1", uri: "https://rupload.facebook.com/ig-api-upload/v23.0/C1" });
      if (url.startsWith("https://rupload")) return reply({ success: true });
      if (url.includes("/C1?fields=status_code")) return reply({ status_code: queue.shift() ?? "FINISHED" });
      if (url.endsWith("/media_publish")) return reply({ id: "M9" });
      if (url.includes("/M9?fields=permalink")) return reply({ permalink: "https://www.instagram.com/reel/abc/" });
      return reply({ error: { message: `unexpected ${url}` } }, false);
    },
  };
  return { transport, calls };
}

describe("readInstagramConfig", () => {
  it("reads the ids and defaults the version", () => {
    expect(readInstagramConfig({ INSTAGRAM_USER_ID: "1", INSTAGRAM_ACCESS_TOKEN: "t" })).toEqual({
      ok: true,
      config: { userId: "1", token: "t", version: "v23.0" },
    });
  });

  it("names what is missing, without throwing (rule 11)", () => {
    expect(readInstagramConfig({ INSTAGRAM_GRAPH_VERSION: "v24.0" })).toEqual({
      ok: false,
      missing: ["INSTAGRAM_USER_ID", "INSTAGRAM_ACCESS_TOKEN"],
    });
  });

  it("refuses a user id or version that would change the Graph path", () => {
    expect(readInstagramConfig({ INSTAGRAM_USER_ID: "1/../2", INSTAGRAM_ACCESS_TOKEN: "t", INSTAGRAM_GRAPH_VERSION: "latest" })).toEqual({
      ok: false,
      missing: ["INSTAGRAM_USER_ID", "INSTAGRAM_GRAPH_VERSION"],
    });
  });
});

describe("publishReel", () => {
  it("creates a resumable container, uploads, waits, publishes and returns the permalink", async () => {
    const { transport, calls } = fakeTransport(["IN_PROGRESS", "FINISHED"]);
    const result = await publishReel(config, new Uint8Array([1, 2, 3]), "Sorted.", transport);

    expect(result).toEqual({ mediaId: "M9", permalink: "https://www.instagram.com/reel/abc/" });
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      "POST https://graph.facebook.com/v23.0/17841/media",
      "POST https://rupload.facebook.com/ig-api-upload/v23.0/C1",
      "GET https://graph.facebook.com/v23.0/C1?fields=status_code",
      "GET https://graph.facebook.com/v23.0/C1?fields=status_code",
      "POST https://graph.facebook.com/v23.0/17841/media_publish",
      "GET https://graph.facebook.com/v23.0/M9?fields=permalink",
    ]);
    const create = new URLSearchParams(String(calls[0].body));
    expect(Object.fromEntries(create)).toEqual({ media_type: "REELS", upload_type: "resumable", caption: "Sorted.", share_to_feed: "true" });
    expect(calls[1].headers).toMatchObject({ authorization: "OAuth secret-token", offset: "0", file_size: "3" });
  });

  it("keeps the token out of every URL", async () => {
    const { transport, calls } = fakeTransport([]);
    await publishReel(config, new Uint8Array([1]), "x", transport);
    expect(calls.every((c) => !c.url.includes("secret-token"))).toBe(true);
    expect(calls.filter((c) => c.url.startsWith("https://graph")).every((c) => c.headers.authorization === "Bearer secret-token")).toBe(true);
  });

  it("stops when Instagram reports the container failed", async () => {
    const { transport } = fakeTransport(["ERROR"]);
    await expect(publishReel(config, new Uint8Array([1]), "x", transport)).rejects.toThrow("Instagram could not process the video (ERROR).");
  });

  it("gives up after the polling limit", async () => {
    const { transport } = fakeTransport(Array.from({ length: 100 }, () => "IN_PROGRESS"));
    await expect(publishReel(config, new Uint8Array([1]), "x", transport, 3)).rejects.toThrow("still processing after 3 checks");
  });

  it("uploads only to rupload.facebook.com", async () => {
    const { transport, calls } = fakeTransport([]);
    transport.fetch = (input, init) => {
      const url = input instanceof Request ? input.url : input.toString();
      calls.push({ url, method: init?.method ?? "GET", headers: {}, body: init?.body });
      return Promise.resolve(new Response(JSON.stringify({ id: "C1", uri: "https://evil.example/C1" })));
    };
    await expect(publishReel(config, new Uint8Array([1]), "x", transport)).rejects.toThrow("not on rupload.facebook.com");
    expect(calls.some((c) => c.url.startsWith("https://evil.example"))).toBe(false);
  });

  it("refuses an id from Instagram that would change the Graph path", async () => {
    const { transport } = fakeTransport([]);
    const real = transport.fetch;
    transport.fetch = (input, init) => (input instanceof Request ? input.url : input.toString()).endsWith("/17841/media")
      ? Promise.resolve(new Response(JSON.stringify({ id: "../me", uri: "https://rupload.facebook.com/x" })))
      : real(input, init);
    await expect(publishReel(config, new Uint8Array([1]), "x", transport)).rejects.toThrow("unexpected id");
  });

  it("passes on the Graph API's own error message", async () => {
    const { transport } = fakeTransport([], { "/17841/media": { error: { message: "Invalid OAuth access token." } } });
    await expect(publishReel(config, new Uint8Array([1]), "x", transport)).rejects.toThrow("Instagram: Invalid OAuth access token.");
  });
});
