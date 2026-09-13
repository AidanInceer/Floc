import { describe, expect, it } from "vitest";

import { readStoredChoice, resolveTheme, THEME_BOOTSTRAP, THEME_STORAGE_KEY } from "./theme";

describe("readStoredChoice", () => {
  it("keeps a real choice", () => {
    expect(readStoredChoice("dark")).toBe("dark");
    expect(readStoredChoice("light")).toBe("light");
  });

  it("is auto for anything else", () => {
    expect(readStoredChoice(undefined)).toBe("system");
    expect(readStoredChoice(null)).toBe("system");
    expect(readStoredChoice("sepia")).toBe("system");
  });
});

describe("resolveTheme", () => {
  it("follows the device only on auto", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
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
    return root.dataset;
  };

  it("uses the stored choice over the browser's setting", () => {
    expect(run("light", true)).toMatchObject({ theme: "light", themeChoice: "light" });
    expect(run("dark", false)).toMatchObject({ theme: "dark", themeChoice: "dark" });
  });

  it("is auto, following the browser, when nothing is stored", () => {
    expect(run(null, true)).toMatchObject({ theme: "dark", themeChoice: "system" });
    expect(run(null, false)).toMatchObject({ theme: "light", themeChoice: "system" });
  });

  it("reads the key storeTheme writes", () => {
    expect(THEME_BOOTSTRAP).toContain(JSON.stringify(THEME_STORAGE_KEY));
  });
});
