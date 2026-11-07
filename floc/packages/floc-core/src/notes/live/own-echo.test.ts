import { describe, expect, it, vi } from "vitest";

import { ownEchoes } from "./own-echo";

function setup() {
  const refresh = vi.fn();
  const timers: (() => void)[] = [];
  const echoes = ownEchoes(refresh, (run) => {
    timers.push(run);
  });
  return { refresh, echoes, fire: () => { timers.splice(0).forEach((run) => { run(); }); } };
}

describe("a change's own echo", () => {
  it("refreshes for somebody else's change", () => {
    const { refresh, echoes } = setup();
    echoes.heard();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("skips the echo of your own change, before or after it returns", () => {
    const { refresh, echoes } = setup();
    const early = echoes.begin();
    echoes.heard();
    early.done(true);

    const late = echoes.begin();
    late.done(true);
    echoes.heard();

    expect(refresh).not.toHaveBeenCalled();
  });

  it("refreshes for a change heard after your own echo", () => {
    const { refresh, echoes } = setup();
    echoes.begin().done(true);
    echoes.heard();
    echoes.heard();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("gives back a change it swallowed while your own was refused", () => {
    const { refresh, echoes } = setup();
    const mine = echoes.begin();
    echoes.heard();
    mine.done(false);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("stops waiting for an echo that never comes", () => {
    const { refresh, echoes, fire } = setup();
    echoes.begin().done(true);
    fire();
    echoes.heard();
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
