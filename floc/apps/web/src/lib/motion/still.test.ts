import { describe, expect, it } from "vitest";

import { themeBootstrap } from "@/lib/theme";

import { heldStill, motionBootstrap, MOTION_STORAGE_KEY, setStill } from "./still";

const rootWith = (motion?: string) => ({ dataset: (motion ? { motion } : {}) as DOMStringMap });

describe("heldStill", () => {
  it("is still when you turned animations off", () => {
    expect(heldStill(rootWith("still"), false)).toBe(true);
  });

  it("is still when the device asks for reduced motion", () => {
    expect(heldStill(rootWith(), true)).toBe(true);
  });

  it("moves when neither asks for stillness", () => {
    expect(heldStill(rootWith(), false)).toBe(false);
  });
});

describe("setStill", () => {
  it("marks the page still, and clears the mark again", () => {
    const root = rootWith();
    setStill(root, true);
    expect(root.dataset.motion).toBe("still");
    setStill(root, false);
    expect(root.dataset.motion).toBeUndefined();
  });
});

describe("motionBootstrap", () => {
  const run = (stored: string | null, signedIn = false) => {
    const root = rootWith();
    new Function("localStorage", "document", motionBootstrap(signedIn))({ getItem: (key: string) => (key === MOTION_STORAGE_KEY ? stored : null) }, { documentElement: root });
    return root.dataset.motion;
  };

  it("holds a signed-out visitor's page still when they turned animations off here before", () => {
    expect(run("still")).toBe("still");
  });

  it("leaves the page moving when nothing was stored", () => {
    expect(run(null)).toBeUndefined();
  });

  it("reads nothing for a signed-in member, whose choice comes from their profile", () => {
    expect(run("still", true)).toBeUndefined();
  });

  it("still runs when it follows the theme script in one tag", () => {
    const root = rootWith();
    const both = themeBootstrap(false) + motionBootstrap(false);
    new Function("localStorage", "document", "matchMedia", both)({ getItem: () => "still" }, { documentElement: root }, () => ({ matches: false }));
    expect(root.dataset.motion).toBe("still");
  });

  it("does not throw when storage is blocked", () => {
    const root = rootWith();
    const blocked = { getItem: () => { throw new Error("blocked"); } };
    expect(() => new Function("localStorage", "document", motionBootstrap(false))(blocked, { documentElement: root })).not.toThrow();
  });
});
