import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { watchRedraw } from "./watch-redraw";

type Watcher = { fire: () => void; watching: unknown[]; options: unknown[]; stopped: boolean };
let watchers: Record<"resize" | "mutation", Watcher[]>;

function fakeObserver(kind: keyof typeof watchers) {
  return class {
    me: Watcher;
    constructor(fire: () => void) {
      this.me = { fire, watching: [], options: [], stopped: false };
      watchers[kind].push(this.me);
    }
    observe(target: unknown, options?: unknown) {
      this.me.watching.push(target);
      this.me.options.push(options);
    }
    disconnect() {
      this.me.stopped = true;
    }
  };
}

const page = { documentElement: { id: "root" } };

beforeEach(() => {
  watchers = { resize: [], mutation: [] };
  vi.stubGlobal("ResizeObserver", fakeObserver("resize"));
  vi.stubGlobal("MutationObserver", fakeObserver("mutation"));
  vi.stubGlobal("document", page);
});

afterEach(() => vi.unstubAllGlobals());

describe("watchRedraw", () => {
  it("redraws when the node changes size", () => {
    const node = {} as Element;
    const redraw = vi.fn();
    watchRedraw(node, redraw);
    expect(watchers.resize[0]!.watching).toEqual([node]);
    watchers.resize[0]!.fire();
    expect(redraw).toHaveBeenCalledOnce();
  });

  it("redraws when the page changes between light and dark", () => {
    const redraw = vi.fn();
    watchRedraw({} as Element, redraw);
    const theme = watchers.mutation[0]!;
    expect(theme.watching).toEqual([page.documentElement]);
    expect(theme.options).toEqual([{ attributes: true, attributeFilter: ["data-theme"] }]);
    theme.fire();
    expect(redraw).toHaveBeenCalledOnce();
  });

  it("stops watching both when stopped", () => {
    const stop = watchRedraw({} as Element, () => {});
    stop();
    expect(watchers.resize[0]!.stopped).toBe(true);
    expect(watchers.mutation[0]!.stopped).toBe(true);
  });
});
