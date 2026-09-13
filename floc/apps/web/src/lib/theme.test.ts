import { describe, expect, it } from "vitest";

import { readStoredChoice, resolveTheme, themeBootstrap, THEME_STORAGE_KEY } from "./theme";

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

describe("themeBootstrap", () => {
  /** It runs before any bundle, so a throw here would take the page with it. */
  const run = (stored: string | null, prefersDark: boolean, signedIn = true) => {
    const root = { dataset: {} as Record<string, string> };
    new Function(
      "localStorage",
      "matchMedia",
      "document",
      themeBootstrap(signedIn),
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

  it("is auto when signed out, whatever is stored", () => {
    expect(run("light", true, false)).toMatchObject({ theme: "dark", themeChoice: "system" });
    expect(run("dark", false, false)).toMatchObject({ theme: "light", themeChoice: "system" });
  });

  it("reads the key storeTheme writes", () => {
    expect(themeBootstrap(true)).toContain(JSON.stringify(THEME_STORAGE_KEY));
  });
});
