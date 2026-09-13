import { afterEach, describe, expect, it, vi } from "vitest";

import { sendExpoPushes } from "@/server/notifications/expo-push";

const message = (to: string) => ({ to, title: "Ours", body: "Hi", data: { href: "/inbox", ids: [1] } });

function answer(body: unknown, ok = true) {
  const fetchMock = vi.fn(async () => ({ ok, status: ok ? 200 : 500, json: async () => body }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("sendExpoPushes", () => {
  it("reports the phones Expo says are gone", async () => {
    answer({ data: [{ status: "ok" }, { status: "error", details: { error: "DeviceNotRegistered" } }] });
    expect(await sendExpoPushes([message("a"), message("b")])).toEqual({ deadTokens: ["b"] });
  });

  it("sends the access token when there is one", async () => {
    vi.stubEnv("EXPO_ACCESS_TOKEN", "secret");
    const fetchMock = answer({ data: [{ status: "ok" }] });
    await sendExpoPushes([message("a")]);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer secret");
  });

  it("throws when Expo refuses, so the claim is released", async () => {
    answer({}, false);
    await expect(sendExpoPushes([message("a")])).rejects.toThrow("Expo push refused: 500");
  });
});
