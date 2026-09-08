/**
 * The only thing worth testing here is the gate: this route hands out a
 * session, so "off unless local and configured" is the whole contract.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth", () => ({
  auth: { api: { signInEmail: vi.fn(async () => new Response("ok")) } },
}));

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.resetModules();
});

async function post(): Promise<Response> {
  const { POST } = await import("./route");
  return POST();
}

async function get(): Promise<Response> {
  const { GET } = await import("./route");
  return GET();
}

describe("the dev sign-in route", () => {
  it("404s in production even with both variables set", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.FLOC_DEV_USER_EMAIL = "test@example.com";
    process.env.FLOC_DEV_USER_PASSWORD = "hunter2";
    expect((await post()).status).toBe(404);
    vi.unstubAllEnvs();
  });

  it("404s locally when the credentials are not configured", async () => {
    delete process.env.FLOC_DEV_USER_EMAIL;
    delete process.env.FLOC_DEV_USER_PASSWORD;
    expect((await post()).status).toBe(404);
  });

  it("404s when only half of it is configured", async () => {
    process.env.FLOC_DEV_USER_EMAIL = "test@example.com";
    delete process.env.FLOC_DEV_USER_PASSWORD;
    expect((await post()).status).toBe(404);
  });

  it("signs in locally when both are set", async () => {
    process.env.FLOC_DEV_USER_EMAIL = "test@example.com";
    process.env.FLOC_DEV_USER_PASSWORD = "hunter2";
    expect((await post()).status).toBe(200);
  });

  it("hands the phone the credentials when it is on, and nothing when it is off", async () => {
    process.env.FLOC_DEV_USER_EMAIL = "test@example.com";
    process.env.FLOC_DEV_USER_PASSWORD = "hunter2";
    await expect((await get()).json()).resolves.toEqual({
      email: "test@example.com",
      password: "hunter2",
    });

    delete process.env.FLOC_DEV_USER_PASSWORD;
    vi.resetModules();
    expect((await get()).status).toBe(404);
  });
});
