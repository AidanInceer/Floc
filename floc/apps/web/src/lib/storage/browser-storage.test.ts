import { afterEach, describe, expect, it, vi } from "vitest";

import { encodeConsent } from "@floc/core/consent/consent";
import { today } from "@floc/core/dates/dates";

import { forgetBrowserConsent } from "@/lib/consent/consent-cookie";

import { readForTab, readStored, writeForTab, writeStored } from "./browser-storage";

const refuse = () => {
  throw new DOMException("denied", "SecurityError");
};

const consent = (functional: boolean) =>
  vi.stubGlobal("document", { cookie: `floc_consent=${encodeConsent({ functional, analytics: false }, today())}` });

afterEach(() => {
  vi.unstubAllGlobals();
  forgetBrowserConsent();
});

describe("browser storage", () => {
  it("reads back what it wrote", () => {
    const held = new Map<string, string>();
    consent(true);
    vi.stubGlobal("localStorage", { getItem: (k: string) => held.get(k) ?? null, setItem: (k: string, v: string) => held.set(k, v) });
    writeStored("floc:ideas-sort", "newest");
    expect(readStored("floc:ideas-sort")).toBe("newest");
  });

  it("writes nothing without a yes to remembering choices (#368)", () => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { getItem: () => null, setItem });
    consent(false);
    writeStored("floc:ideas-sort", "newest");
    forgetBrowserConsent();
    vi.stubGlobal("document", { cookie: "" });
    writeStored("floc:ideas-sort", "newest");
    expect(setItem).not.toHaveBeenCalled();
  });

  it("reads nothing, and does not throw, when the browser refuses storage", () => {
    consent(true);
    vi.stubGlobal("localStorage", { getItem: refuse, setItem: refuse });
    expect(readStored("floc:ideas-sort")).toBeNull();
    expect(() => writeStored("floc:ideas-sort", "newest")).not.toThrow();
  });
});

describe("what a tab remembers until it closes", () => {
  it("reads back what it wrote", () => {
    const held = new Map<string, string>();
    vi.stubGlobal("sessionStorage", { getItem: (k: string) => held.get(k) ?? null, setItem: (k: string, v: string) => held.set(k, v) });
    writeForTab("floc.bookings.asked", "7");
    expect(held.get("floc.bookings.asked")).toBe("7");
    expect(readForTab("floc.bookings.asked")).toBe("7");
  });

  it("still remembers, and does not throw, when the browser refuses storage", () => {
    vi.stubGlobal("sessionStorage", { getItem: refuse, setItem: refuse });
    expect(readForTab("floc.bookings.never")).toBeNull();
    expect(() => writeForTab("floc.bookings.asked", "9")).not.toThrow();
    expect(readForTab("floc.bookings.asked")).toBe("9");
  });
});
