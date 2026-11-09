/**
 * The dev link hands out a session and a redirect, so the contract is the gate,
 * the person it may become, and where it may send you.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const signInEmail = vi.fn(async () => {
  const res = new Response("ok");
  res.headers.append("Set-Cookie", "better-auth.session_token=new; Path=/; HttpOnly");
  return res;
});

vi.mock("@/server/auth/auth", () => ({ auth: { api: { signInEmail } } }));

vi.mock("@/server/auth/dev-accounts", async (original) => {
  const real = await original<typeof import("@/server/auth/dev-accounts")>();
  return {
    ...real,
    devAccountEmail: vi.fn(async (id: string) =>
      ({ "dev-user": "test@example.com", "seed-a-priya": "priya@a.seed.floc.test", real: "someone@gmail.com" })[id] ?? null,
    ),
  };
});

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
  signInEmail.mockClear();
  vi.resetModules();
});

function doorOpen(): void {
  process.env.FLOC_DEV_USER_EMAIL = "test@example.com";
  process.env.FLOC_DEV_USER_PASSWORD = "hunter2";
}

async function enter(query: string, cookie?: string): Promise<Response> {
  const { GET } = await import("./route");
  const headers = cookie ? { cookie } : undefined;
  return GET(new Request(`http://localhost/api/dev/enter?${query}`, { headers }));
}

describe("the dev enter link", () => {
  it("404s when the dev door is shut", async () => {
    delete process.env.FLOC_DEV_USER_PASSWORD;
    expect((await enter("to=/trips")).status).toBe(404);
  }, 30_000);

  it("404s in production", async () => {
    doorOpen();
    vi.stubEnv("NODE_ENV", "production");
    expect((await enter("to=/trips&as=dev-user")).status).toBe(404);
    vi.unstubAllEnvs();
  });

  it("never sends you off this site", async () => {
    doorOpen();
    for (const to of ["", "trips", "//evil.example", "https://evil.example", "/\\evil.example"]) {
      expect((await enter(`to=${encodeURIComponent(to)}`)).status).toBe(404);
    }
  });

  it("signs you out and lands you on the page when nobody is named", async () => {
    doorOpen();
    const res = await enter("to=/signup", "better-auth.session_token=old; theme=dark");
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/signup");
    expect(res.headers.getSetCookie()).toEqual([expect.stringMatching(/^better-auth\.session_token=; .*Max-Age=0/)]);
    expect(signInEmail).not.toHaveBeenCalled();
  });

  it("signs you in as a dev account and lands you on the page", async () => {
    doorOpen();
    const res = await enter(`as=seed-a-priya&to=${encodeURIComponent("/trip/1/overview")}`);
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/trip/1/overview");
    expect(res.headers.getSetCookie()).toContain("better-auth.session_token=new; Path=/; HttpOnly");
    expect(signInEmail).toHaveBeenCalledWith(
      expect.objectContaining({ body: { email: "priya@a.seed.floc.test", password: "seed-password" } }),
    );
  });

  it("refuses anybody the dev door does not know", async () => {
    doorOpen();
    expect((await enter("as=real&to=/trips")).status).toBe(404);
    expect((await enter("as=nobody&to=/trips")).status).toBe(404);
  });
});
