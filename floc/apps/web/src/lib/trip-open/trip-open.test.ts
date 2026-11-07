// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BAR_HOLD_EVENT } from "@/lib/bar-fuse";

import { POUR_MS } from "./curtain";

type TripOpen = typeof import("./trip-open");

let api: TripOpen;
let frames: FrameRequestCallback[];
let holds: boolean[];
const onHold = (e: Event) => holds.push((e as CustomEvent<boolean>).detail);

const HREF = "/trip/7/overview";
const state = () => document.documentElement.dataset.tripOpen;
const box = { left: 10, top: 10, right: 110, bottom: 40, width: 100, height: 30, x: 10, y: 10 };

function reducedMotion(on: boolean) {
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: on && q.includes("reduce"), media: q }));
}

function pour(now: number) {
  const due = frames;
  frames = [];
  for (const f of due) f(now);
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  vi.resetModules();
  api = await import("./trip-open");
  frames = [];
  holds = [];
  vi.stubGlobal("requestAnimationFrame", (f: FrameRequestCallback) => frames.push(f));
  vi.spyOn(performance, "now").mockReturnValue(0);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(box as DOMRect);
  reducedMotion(false);
  document.body.innerHTML = `<header><div class="fuse-row"><a>Trips</a><svg></svg><a>Money</a></div></header><main><section>Lisbon</section></main>`;
  window.addEventListener(BAR_HOLD_EVENT, onHold);
});

afterEach(() => {
  window.removeEventListener(BAR_HOLD_EVENT, onHold);
  window.dispatchEvent(new PopStateEvent("popstate"));
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("openTrip", () => {
  it("changes page at once under reduced motion", () => {
    reducedMotion(true);
    const navigate = vi.fn();
    api.openTrip(HREF, navigate);
    expect(navigate).toHaveBeenCalledWith(HREF);
    expect(state()).toBeUndefined();
  });

  it("changes page at once when there is no top bar", () => {
    document.body.innerHTML = "<main></main>";
    const navigate = vi.fn();
    api.openTrip(HREF, navigate);
    expect(navigate).toHaveBeenCalledWith(HREF);
    expect(holds).toEqual([]);
  });

  it("fades the list and holds the bar, then changes page", () => {
    const navigate = vi.fn();
    api.openTrip(HREF, navigate);
    expect(state()).toBe("leaving");
    expect(holds).toEqual([true]);
    expect(navigate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(state()).toBe("waiting");
    expect(navigate).toHaveBeenCalledWith(HREF);
  });

  it("opens a second trip plainly while one is opening", () => {
    api.openTrip(HREF, vi.fn());
    const navigate = vi.fn();
    api.openTrip("/trip/8/overview", navigate);
    expect(navigate).toHaveBeenCalledWith("/trip/8/overview");
  });

  it("lets go when the person goes back before the page changes", () => {
    const navigate = vi.fn();
    api.openTrip(HREF, navigate);
    window.dispatchEvent(new PopStateEvent("popstate"));
    vi.advanceTimersByTime(300);
    expect(navigate).not.toHaveBeenCalled();
    expect(state()).toBeUndefined();
    expect(holds).toEqual([true, false]);
  });

  it("shows the page plainly when it never arrives", () => {
    api.openTrip(HREF, vi.fn());
    vi.advanceTimersByTime(2800);
    expect(state()).toBeUndefined();
    expect(holds).toEqual([true, false]);
  });
});

describe("arrive", () => {
  const target = () => document.querySelector("section")!;

  it("does nothing when no trip is opening", () => {
    api.arrive(target(), HREF);
    expect(state()).toBeUndefined();
    expect(document.querySelector(".trip-open-goo")).toBeNull();
  });

  it("lets go when a different page arrives", () => {
    api.openTrip(HREF, vi.fn());
    api.arrive(target(), "/trip/9/overview");
    expect(state()).toBeUndefined();
    expect(holds).toEqual([true, false]);
  });

  it("pours the page out of the bar, then cleans up", () => {
    api.openTrip(HREF, vi.fn());
    vi.advanceTimersByTime(300);
    api.arrive(target(), HREF);
    expect(state()).toBe("pouring");
    expect(document.querySelector(".trip-open-goo")).not.toBeNull();

    pour(POUR_MS / 2);
    expect(document.querySelectorAll(".trip-open-goo rect").length).toBeGreaterThan(0);
    expect(document.documentElement.style.getPropertyValue("--trip-open-page")).toBe("0");

    pour(POUR_MS);
    expect(document.querySelector(".trip-open-goo")).toBeNull();
    expect(state()).toBeUndefined();
    expect(document.documentElement.style.getPropertyValue("--trip-open-page")).toBe("");
    expect(holds).toEqual([true, false]);
  });

  it("pours once when the page's effect runs twice", () => {
    api.openTrip(HREF, vi.fn());
    api.arrive(target(), HREF);
    api.arrive(target(), HREF);
    expect(document.querySelectorAll(".trip-open-goo").length).toBe(1);
  });

  it("is not undone by the give-up timer once pouring", () => {
    api.openTrip(HREF, vi.fn());
    vi.advanceTimersByTime(300);
    api.arrive(target(), HREF);
    vi.advanceTimersByTime(5000);
    expect(state()).toBe("pouring");
  });
});
