import { describe, expect, it } from "vitest";

import { SHARED_CHECK_MS, sessionResolver } from "./live-session";

const answering = (status: number, body: unknown) => {
  const calls: RequestInit[] = [];
  const urls: string[] = [];
  const fetchFn = (async (_url: string, init: RequestInit) => {
    urls.push(_url);
    calls.push(init);
    return new Response(JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
  return { fetchFn, calls, urls };
};

describe("session over the socket", () => {
  it("bypasses the signed cookie cache when checking revocation", async () => {
    const { fetchFn, urls } = answering(200, { user: { id: "u-1" } });
    await sessionResolver("http://x", fetchFn)(new Headers({ cookie: "s=1" }));
    expect(new URL(urls[0]).searchParams.get("disableCookieCache")).toBe("true");
  });

  it("answers the signed-in user's id, forwarding only the cookie", async () => {
    const { fetchFn, calls } = answering(200, { user: { id: "u-1" } });
    const resolve = sessionResolver("http://x", fetchFn);
    const id = await resolve(new Headers({ cookie: "s=1", authorization: "Bearer t" }));
    expect(id).toBe("u-1");
    expect(calls[0].headers).toEqual({ cookie: "s=1" });
  });

  it("forwards the caller's address too, so Better Auth rate-limits them and not one shared bucket", async () => {
    const { fetchFn, calls } = answering(200, { user: { id: "u-1" } });
    await sessionResolver("http://x", fetchFn)(new Headers({ cookie: "s=1", "x-real-ip": "203.0.113.7" }));
    expect(calls[0].headers).toEqual({ cookie: "s=1", "x-real-ip": "203.0.113.7" });
  });

  it("answers null with no cookie, a failed call, or no session", async () => {
    expect(await sessionResolver("http://x", answering(200, {}).fetchFn)(new Headers())).toBeNull();
    const failed = sessionResolver("http://x", answering(500, {}).fetchFn);
    expect(await failed(new Headers({ cookie: "s=1" }))).toBeNull();
    const none = sessionResolver("http://x", answering(200, null).fetchFn);
    expect(await none(new Headers({ cookie: "s=1" }))).toBeNull();
  });

  it("asks once when one page opens two documents with the same cookie at once", async () => {
    const { fetchFn, urls } = answering(200, { user: { id: "u-1" } });
    let now = 1_000;
    const resolve = sessionResolver("http://x", fetchFn, () => now);
    const headers = new Headers({ cookie: "s=1" });
    expect(await Promise.all([resolve(headers), resolve(headers)])).toEqual(["u-1", "u-1"]);
    expect(urls).toHaveLength(1);

    now += SHARED_CHECK_MS;
    await resolve(headers);
    expect(urls).toHaveLength(2);
  });

  it("never shares a check between two cookies", async () => {
    const { fetchFn, urls } = answering(200, { user: { id: "u-1" } });
    const resolve = sessionResolver("http://x", fetchFn, () => 1_000);
    await resolve(new Headers({ cookie: "s=1" }));
    await resolve(new Headers({ cookie: "s=2" }));
    expect(urls).toHaveLength(2);
  });
});
