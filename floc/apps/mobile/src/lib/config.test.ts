import { afterEach, describe, expect, it, vi } from "vitest";

const expoConfig: { hostUri?: string } = {};
vi.mock("expo-constants", () => ({ default: { expoConfig } }));

async function load({ dev, env, hostUri }: { dev: boolean; env?: string; hostUri?: string }) {
  vi.resetModules();
  vi.stubGlobal("__DEV__", dev);
  if (env === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = env;
  expoConfig.hostUri = hostUri;
  return import("./config");
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.EXPO_PUBLIC_API_URL;
});

describe("API_BASE_URL", () => {
  it("takes EXPO_PUBLIC_API_URL over everything", async () => {
    const config = await load({ dev: true, env: "http://192.168.1.5:3000", hostUri: "10.0.0.2:8081" });
    expect(config.API_BASE_URL).toBe("http://192.168.1.5:3000");
    expect(config.TRPC_URL).toBe("http://192.168.1.5:3000/api/trpc");
  });

  it("uses the Metro host on port 3000 in development", async () => {
    const config = await load({ dev: true, hostUri: "10.0.0.2:8081" });
    expect(config.API_BASE_URL).toBe("http://10.0.0.2:3000");
  });

  it("falls back to production in development with no Metro host", async () => {
    const config = await load({ dev: true });
    expect(config.API_BASE_URL).toBe("https://floc.app");
  });

  it("is production in a store build, whatever Metro says", async () => {
    const config = await load({ dev: false, hostUri: "10.0.0.2:8081" });
    expect(config.API_BASE_URL).toBe("https://floc.app");
  });
});

describe("inviteUrl", () => {
  it("builds the link from the token alone", async () => {
    const config = await load({ dev: false });
    expect(config.inviteUrl("abc123")).toBe("https://floc.app/invite/abc123");
  });
});
