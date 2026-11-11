import { afterEach, describe, expect, it, vi } from "vitest";

import { readStored, writeStored } from "./browser-storage";

const refuse = () => {
  throw new DOMException("denied", "SecurityError");
};

afterEach(() => vi.unstubAllGlobals());

describe("browser storage", () => {
  it("reads back what it wrote", () => {
    const held = new Map<string, string>();
    vi.stubGlobal("localStorage", { getItem: (k: string) => held.get(k) ?? null, setItem: (k: string, v: string) => held.set(k, v) });
    writeStored("floc:ideas-sort", "newest");
    expect(readStored("floc:ideas-sort")).toBe("newest");
  });

  it("reads nothing, and does not throw, when the browser refuses storage", () => {
    vi.stubGlobal("localStorage", { getItem: refuse, setItem: refuse });
    expect(readStored("floc:ideas-sort")).toBeNull();
    expect(() => writeStored("floc:ideas-sort", "newest")).not.toThrow();
  });
});
