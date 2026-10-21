import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { frameLoop } from "./frame-loop";

let queued: FrameRequestCallback[] = [];
let clock = 0;

const runFrame = (ms = 16) => {
  clock += ms;
  const next = queued;
  queued = [];
  next.forEach((cb) => cb(clock));
};

beforeEach(() => {
  queued = [];
  clock = 1000;
  vi.stubGlobal("performance", { now: () => clock });
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => queued.push(cb));
  vi.stubGlobal("cancelAnimationFrame", () => (queued = []));
});

afterEach(() => vi.unstubAllGlobals());

describe("frameLoop", () => {
  it("runs a frame only after it is woken", () => {
    const step = vi.fn(() => false);
    const loop = frameLoop(step);
    runFrame();
    expect(step).not.toHaveBeenCalled();
    loop.wake();
    runFrame();
    expect(step).toHaveBeenCalledOnce();
  });

  it("keeps running while the step says something moves, then rests", () => {
    let left = 3;
    const step = vi.fn(() => --left > 0);
    frameLoop(step).wake();
    for (let i = 0; i < 6; i++) runFrame();
    expect(step).toHaveBeenCalledTimes(3);
  });

  it("asks for one frame however often it is woken", () => {
    const loop = frameLoop(() => false);
    loop.wake();
    loop.wake();
    expect(queued).toHaveLength(1);
  });

  it("gives the step the time since the last frame, at most 50 ms", () => {
    const gaps: number[] = [];
    frameLoop((_, dt) => {
      gaps.push(dt);
      return gaps.length < 2;
    }).wake();
    runFrame(16);
    runFrame(200);
    expect(gaps).toEqual([16, 50]);
  });

  it("stops for good when stopped", () => {
    const step = vi.fn(() => true);
    const loop = frameLoop(step);
    loop.wake();
    loop.stop();
    runFrame();
    expect(step).not.toHaveBeenCalled();
  });
});
