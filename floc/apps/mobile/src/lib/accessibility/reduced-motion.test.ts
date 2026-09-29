import { afterEach, describe, expect, it, vi } from "vitest";

const native = vi.hoisted(() => ({
  read: vi.fn<() => Promise<boolean>>(),
  listen: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("react-native", () => ({
  AccessibilityInfo: {
    isReduceMotionEnabled: native.read,
    addEventListener: native.listen,
  },
}));

import { observeReducedMotion } from "./reduced-motion";

afterEach(() => vi.resetAllMocks());

describe("the phone's motion preference", () => {
  it("honours reduced motion when the device requests it", async () => {
    native.read.mockResolvedValue(true);
    native.listen.mockReturnValue({ remove: native.remove });
    const changed = vi.fn();
    const stop = observeReducedMotion(changed);

    await vi.waitFor(() => expect(changed).toHaveBeenCalledWith(true));
    stop();
  });

  it("uses a live setting change instead of an older initial read", async () => {
    let resolveRead!: (reduced: boolean) => void;
    native.read.mockReturnValue(new Promise((resolve) => { resolveRead = resolve; }));
    let onChange!: (reduced: boolean) => void;
    native.listen.mockImplementation((_event, listener) => {
      onChange = listener;
      return { remove: native.remove };
    });
    const changed = vi.fn();
    const stop = observeReducedMotion(changed);

    onChange(true);
    resolveRead(false);
    await Promise.resolve();
    expect(changed.mock.calls).toEqual([[true]]);
    stop();
  });

  it("stops notifying after the observer is removed", async () => {
    let resolveRead!: (reduced: boolean) => void;
    native.read.mockReturnValue(new Promise((resolve) => { resolveRead = resolve; }));
    native.listen.mockReturnValue({ remove: native.remove });
    const changed = vi.fn();
    const stop = observeReducedMotion(changed);

    stop();
    resolveRead(false);
    await Promise.resolve();
    expect(changed).not.toHaveBeenCalled();
    expect(native.remove).toHaveBeenCalledOnce();
  });

  it("keeps motion reduced if the device preference cannot be read", async () => {
    native.read.mockRejectedValue(new Error("Unavailable"));
    native.listen.mockReturnValue({ remove: native.remove });
    const changed = vi.fn();
    const stop = observeReducedMotion(changed);

    await vi.waitFor(() => expect(changed).toHaveBeenCalledWith(true));
    stop();
  });

  it("allows motion when the device setting is off and follows later changes", async () => {
    native.read.mockResolvedValue(false);
    let onChange!: (reduced: boolean) => void;
    native.listen.mockImplementation((_event, listener) => {
      onChange = listener;
      return { remove: native.remove };
    });
    const changed = vi.fn();
    const stop = observeReducedMotion(changed);

    await vi.waitFor(() => expect(changed).toHaveBeenCalledWith(false));
    onChange(true);
    onChange(false);
    expect(changed.mock.calls).toEqual([[false], [true], [false]]);
    stop();
    onChange(true);
    expect(changed).toHaveBeenCalledTimes(3);
  });
});
