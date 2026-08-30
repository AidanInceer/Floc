import { afterEach, describe, expect, it, vi } from "vitest";

import { getHomeRates } from "@/server/fx";

afterEach(() => vi.unstubAllGlobals());

function stubFetch(body: unknown, ok = true) {
  const fn = vi.fn(async () => ({ ok, json: async () => body }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("getHomeRates", () => {
  it("turns per-home rates into home-per-unit multipliers", async () => {
    // 1 GBP = 1.25 EUR, 1 GBP = 1.30 USD.
    const fetchMock = stubFetch({ rates: { EUR: 1.25, USD: 1.3 } });
    const rates = await getHomeRates("GBP");

    expect(rates?.home).toBe("GBP");
    expect(rates?.toHome.GBP).toBe(1); // home is identity
    // €12.50 → £10.00: 1250 * (1/1.25) = 1000.
    expect(Math.round(1250 * (rates?.toHome.EUR ?? 0))).toBe(1000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("degrades to null on a non-OK response, never throws (rule 11)", async () => {
    stubFetch({}, false);
    expect(await getHomeRates("GBP")).toBeNull();
  });

  it("degrades to null when the provider is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    expect(await getHomeRates("GBP")).toBeNull();
  });

  it("degrades to null on a malformed body", async () => {
    stubFetch({ rates: { EUR: 0 } }); // a zero rate can't be inverted
    expect(await getHomeRates("GBP")).toBeNull();
  });
});
