import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { watchFirstView } from "./scene-start";

type Options = IntersectionObserverInit;
let observers: { callback: IntersectionObserverCallback; options: Options | undefined; observed: Element[]; disconnect: ReturnType<typeof vi.fn> }[];
let motion: { matches: boolean; listeners: Set<() => void> };

beforeEach(() => {
  observers = [];
  motion = { matches: false, listeners: new Set() };
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      entry: (typeof observers)[number];
      constructor(callback: IntersectionObserverCallback, options?: Options) {
        this.entry = { callback, options, observed: [], disconnect: vi.fn() };
        observers.push(this.entry);
      }
      observe(node: Element) {
        this.entry.observed.push(node);
      }
      disconnect() {
        this.entry.disconnect();
      }
    },
  );
  vi.stubGlobal("matchMedia", () => ({
    get matches() {
      return motion.matches;
    },
    addEventListener: (_: string, cb: () => void) => motion.listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => motion.listeners.delete(cb),
  }));
});

afterEach(() => vi.unstubAllGlobals());

const node = {} as Element;
const show = (isIntersecting: boolean) => observers[0]!.callback([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);

describe("watchFirstView", () => {
  it("does not start until the stage is on screen", () => {
    const onStart = vi.fn();
    watchFirstView(node, { onStart });
    show(false);
    expect(onStart).not.toHaveBeenCalled();
  });

  it("starts once, the first time the stage is on screen", () => {
    const onStart = vi.fn();
    watchFirstView(node, { onStart });
    show(true);
    expect(onStart).toHaveBeenCalledWith({ still: false });
    expect(observers[0]!.disconnect).toHaveBeenCalled();
  });

  it("starts still when the person asks for reduced motion", () => {
    motion.matches = true;
    const onStart = vi.fn();
    watchFirstView(node, { onStart });
    show(true);
    expect(onStart).toHaveBeenCalledWith({ still: true });
  });

  it("measures from a margin, so a stage taller than the screen still starts", () => {
    watchFirstView(node, { onStart: vi.fn() });
    expect(observers[0]!.options).toEqual({ rootMargin: "0px 0px -35% 0px" });
  });

  it("tells the scene at once whether it begins still, so it can arm itself", () => {
    const onArm = vi.fn();
    motion.matches = true;
    watchFirstView(node, { onStart: vi.fn(), onArm });
    expect(onArm).toHaveBeenCalledWith({ still: true });
  });

  it("calls back when reduced motion is switched on later", () => {
    const onStill = vi.fn();
    watchFirstView(node, { onStart: vi.fn(), onStill });
    motion.matches = true;
    motion.listeners.forEach((cb) => cb());
    expect(onStill).toHaveBeenCalledTimes(1);
  });

  it("stays quiet when motion is switched back on", () => {
    const onStill = vi.fn();
    watchFirstView(node, { onStart: vi.fn(), onStill });
    motion.listeners.forEach((cb) => cb());
    expect(onStill).not.toHaveBeenCalled();
  });

  it("stops watching on cleanup", () => {
    const stop = watchFirstView(node, { onStart: vi.fn(), onStill: vi.fn() });
    stop();
    expect(observers[0]!.disconnect).toHaveBeenCalled();
    expect(motion.listeners.size).toBe(0);
  });
});
