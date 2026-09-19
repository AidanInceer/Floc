import { describe, expect, it } from "vitest";

import { sessionResolver } from "./live-session";

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

  it("answers null with no cookie, a failed call, or no session", async () => {
    expect(await sessionResolver("http://x", answering(200, {}).fetchFn)(new Headers())).toBeNull();
    const failed = sessionResolver("http://x", answering(500, {}).fetchFn);
    expect(await failed(new Headers({ cookie: "s=1" }))).toBeNull();
    const none = sessionResolver("http://x", answering(200, null).fetchFn);
    expect(await none(new Headers({ cookie: "s=1" }))).toBeNull();
  });
});
