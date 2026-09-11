import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signInEmail = vi.fn();
vi.mock("./auth", () => ({ signIn: { email: signInEmail } }));
vi.mock("./config", () => ({ API_BASE_URL: "http://dev.test:3000" }));

const { devAccounts, devSignIn } = await import("./dev-sign-in");

const ada = { email: "ada@floc.test", name: "Ada", password: "pw-ada" };
const mo = { email: "mo@floc.test", name: "Mo", password: "pw-mo" };

function respond(ok: boolean, body: unknown = {}) {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok, json: async () => body })));
}

beforeEach(() => signInEmail.mockReset());
afterEach(() => vi.unstubAllGlobals());

describe("devAccounts", () => {
  it("asks the dev route on the API host", async () => {
    respond(true, { email: ada.email, password: ada.password, accounts: [ada, mo] });
    await devAccounts();
    expect(fetch).toHaveBeenCalledWith("http://dev.test:3000/api/dev/sign-in");
  });

  it("returns the roster when the server offers one", async () => {
    respond(true, { email: ada.email, password: ada.password, accounts: [ada, mo] });
    expect(await devAccounts()).toEqual([ada, mo]);
  });

  it("falls back to the top-level pair from an older server", async () => {
    respond(true, { email: ada.email, password: ada.password, accounts: [] });
    expect(await devAccounts()).toEqual([{ email: ada.email, name: "Dev account", password: ada.password }]);
  });

  it("is null when the route is off", async () => {
    respond(false);
    expect(await devAccounts()).toBeNull();
  });

  it("is null when there is no server at all", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("Network request failed");
    }));
    expect(await devAccounts()).toBeNull();
  });
});

describe("devSignIn", () => {
  it("signs in as the account it is given", async () => {
    signInEmail.mockResolvedValue({ error: null });
    expect(await devSignIn(mo)).toBeNull();
    expect(signInEmail).toHaveBeenCalledWith({ email: mo.email, password: mo.password });
  });

  it("takes the first account when none is given", async () => {
    respond(true, { email: ada.email, password: ada.password, accounts: [ada, mo] });
    signInEmail.mockResolvedValue({ error: null });
    expect(await devSignIn()).toBeNull();
    expect(signInEmail).toHaveBeenCalledWith({ email: ada.email, password: ada.password });
  });

  it("says which variables are missing when there is no account", async () => {
    respond(false);
    expect(await devSignIn()).toMatch(/FLOC_DEV_USER_EMAIL and FLOC_DEV_USER_PASSWORD/);
    expect(signInEmail).not.toHaveBeenCalled();
  });

  it("passes the server's own words through on failure", async () => {
    signInEmail.mockResolvedValue({ error: { message: "Invalid password" } });
    expect(await devSignIn(ada)).toBe("Sign-in failed at http://dev.test:3000: Invalid password");

    signInEmail.mockResolvedValue({ error: { statusText: "Unauthorized" } });
    expect(await devSignIn(ada)).toMatch(/Unauthorized$/);

    signInEmail.mockResolvedValue({ error: { status: 401 } });
    expect(await devSignIn(ada)).toMatch(/401$/);
  });
});
