import { describe, expect, it } from "vitest";

import { readStoredTheme, THEME_BOOTSTRAP, THEME_STORAGE_KEY } from "./theme";

describe("readStoredTheme", () => {
  it("keeps a real choice", () => {
    expect(readStoredTheme("dark")).toBe("dark");
    expect(readStoredTheme("light")).toBe("light");
  });

  it("falls back to light for anything else", () => {
    expect(readStoredTheme(undefined)).toBe("light");
    expect(readStoredTheme(null)).toBe("light");
    expect(readStoredTheme("system")).toBe("light");
  });
});

describe("THEME_BOOTSTRAP", () => {
  /** It runs before any bundle, so a throw here would take the page with it. */
  const run = (stored: string | null, prefersDark: boolean) => {
    const root = { dataset: {} as Record<string, string> };
    new Function(
      "localStorage",
      "matchMedia",
      "document",
      THEME_BOOTSTRAP,
    )(
      {
        getItem: () => stored,
      },
      () => ({ matches: prefersDark }),
      { documentElement: root },
    );
    return root.dataset.theme;
  };

  it("uses the stored choice over the browser's setting", () => {
    expect(run("light", true)).toBe("light");
    expect(run("dark", false)).toBe("dark");
  });

  it("falls back to the browser's setting when nothing is stored", () => {
    expect(run(null, true)).toBe("dark");
    expect(run(null, false)).toBe("light");
  });

  it("reads the key storeTheme writes", () => {
    expect(THEME_BOOTSTRAP).toContain(JSON.stringify(THEME_STORAGE_KEY));
  });
});
