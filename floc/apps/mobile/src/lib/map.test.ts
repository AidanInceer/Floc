import { afterEach, describe, expect, it, vi } from "vitest";

async function load(key?: string) {
  vi.resetModules();
  if (key === undefined) delete process.env.EXPO_PUBLIC_MAPTILER_KEY;
  else process.env.EXPO_PUBLIC_MAPTILER_KEY = key;
  return import("./map");
}

afterEach(() => {
  delete process.env.EXPO_PUBLIC_MAPTILER_KEY;
});

describe("tiles", () => {
  it("uses MapTiler with a key, and credits it", async () => {
    const map = await load("pk_test");
    expect(map.TILE_URL).toContain("api.maptiler.com");
    expect(map.TILE_URL).toContain("key=pk_test");
    expect(map.TILE_ATTRIBUTION).toContain("MapTiler");
  });

  it("falls back to raw OpenStreetMap without a key", async () => {
    const map = await load();
    expect(map.TILE_URL).toBe("https://tile.openstreetmap.org/{z}/{x}/{y}.png");
    expect(map.TILE_ATTRIBUTION).toBe("© OpenStreetMap contributors");
  });

  it("builds one raster style that always carries the attribution", async () => {
    const map = await load();
    const source = map.TILE_STYLE.sources.base as { tiles: string[]; attribution: string; maxzoom: number };
    expect(source.tiles).toEqual([map.TILE_URL]);
    expect(source.attribution).toBe(map.TILE_ATTRIBUTION);
    expect(source.maxzoom).toBe(map.MAX_ZOOM);
  });
});

describe("paperStyle", () => {
  it("is a background of the given colour and no tiles", async () => {
    const { paperStyle } = await load();
    const style = paperStyle("#fafaf7");
    expect(style.sources).toEqual({});
    expect(style.layers).toEqual([
      { id: "paper", type: "background", paint: { "background-color": "#fafaf7" } },
    ]);
  });
});
