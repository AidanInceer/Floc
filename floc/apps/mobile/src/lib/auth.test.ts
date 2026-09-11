import { describe, expect, it, vi } from "vitest";

const getCookie = vi.fn();
const createAuthClient = vi.fn(() => ({ getCookie, signIn: {}, signUp: {}, signOut: vi.fn() }));
const expoClient = vi.fn((options: unknown) => ({ id: "expo", options }));

vi.mock("better-auth/react", () => ({ createAuthClient }));
vi.mock("@better-auth/expo/client", () => ({ expoClient }));
vi.mock("expo-secure-store", () => ({ getItemAsync: vi.fn(), setItemAsync: vi.fn() }));
vi.mock("./config", () => ({ API_BASE_URL: "http://dev.test:3000" }));

const auth = await import("./auth");
const SecureStore = await import("expo-secure-store");

describe("authClient", () => {
  it("talks to the API host and keeps the session in the keychain", () => {
    expect(createAuthClient).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: "http://dev.test:3000" }),
    );
    expect(expoClient).toHaveBeenCalledWith({ scheme: "floc", storagePrefix: "floc", storage: SecureStore });
  });

  it("comes back to the app, not the website", () => {
    expect(auth.RESET_REDIRECT).toBe("floc://reset-password");
    expect(auth.VERIFY_REDIRECT).toBe("floc://verified");
  });
});

describe("authHeaders", () => {
  it("sends the session cookie when signed in", async () => {
    getCookie.mockReturnValue("floc.session_token=abc");
    expect(await auth.authHeaders()).toEqual({ Cookie: "floc.session_token=abc" });
  });

  it("sends nothing when signed out", async () => {
    getCookie.mockReturnValue("");
    expect(await auth.authHeaders()).toEqual({});
  });

  it("reads the cookie fresh on every request", async () => {
    getCookie.mockReset();
    getCookie.mockReturnValueOnce("a=1").mockReturnValueOnce("a=2");
    expect(await auth.authHeaders()).toEqual({ Cookie: "a=1" });
    expect(await auth.authHeaders()).toEqual({ Cookie: "a=2" });
  });
});
