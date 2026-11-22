import { beforeEach, describe, expect, it, vi } from "vitest";

type Script = { src: string; async: boolean; onerror: (() => void) | null };

function fakePage() {
  const scripts: Script[] = [];
  const waits: { run: () => void; ms: number }[] = [];
  const page = {
    setTimeout: (run: () => void, ms: number) => waits.push({ run, ms }),
    document: {
      createElement: () => ({ src: "", async: false, onerror: null }) as Script,
      head: { appendChild: (s: Script) => scripts.push(s) },
    },
    google: { maps: { importLibrary: vi.fn((name: string) => Promise.resolve({ name })) } },
  } as Record<string, unknown>;
  return { page, scripts, waits };
}

async function loader() {
  vi.resetModules();
  return (await import("./load-google-maps")).loadGoogleMaps;
}

describe("loadGoogleMaps", () => {
  let world: ReturnType<typeof fakePage>;
  beforeEach(() => {
    world = fakePage();
  });

  it("adds Google's script once, with the key, and hands back its libraries", async () => {
    const load = await loader();
    const first = load("browser-key", world.page as never);
    const second = load("browser-key", world.page as never);
    expect(world.scripts).toHaveLength(1);
    const url = new URL(world.scripts[0].src);
    expect(url.origin + url.pathname).toBe("https://maps.googleapis.com/maps/api/js");
    expect(Object.fromEntries(url.searchParams)).toEqual({ key: "browser-key", v: "weekly", loading: "async", callback: "flocMapsReady" });

    (world.page.flocMapsReady as () => void)();
    expect(await first).toEqual({ maps: { name: "maps" }, marker: { name: "marker" }, core: { name: "core" } });
    expect(await second).toBe(await first);

    world.waits[0].run();
    await load("browser-key", world.page as never);
    expect(world.scripts).toHaveLength(1);
  });

  it("fails when the script cannot load, and tries again next time (rule 11)", async () => {
    const load = await loader();
    const first = load("browser-key", world.page as never);
    world.scripts[0].onerror?.();
    await expect(first).rejects.toThrow("Google Maps did not load");

    void load("browser-key", world.page as never).catch(() => undefined);
    expect(world.scripts).toHaveLength(2);
  });

  it("gives up on a script that stalls, so the paper map can draw (rule 11)", async () => {
    const load = await loader();
    const first = load("browser-key", world.page as never);
    expect(world.waits[0].ms).toBe(8000);
    world.waits[0].run();
    await expect(first).rejects.toThrow("Google Maps did not load");
  });

  it("fails when a library does not arrive", async () => {
    const load = await loader();
    (world.page.google as { maps: { importLibrary: unknown } }).maps.importLibrary = vi.fn(() => Promise.reject(new Error("blocked")));
    const first = load("browser-key", world.page as never);
    (world.page.flocMapsReady as () => void)();
    await expect(first).rejects.toThrow("Google Maps did not load");
  });
});
