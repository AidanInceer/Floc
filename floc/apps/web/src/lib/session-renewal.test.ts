import { describe, expect, it, vi } from "vitest";

import { RENEW_EVERY_MS, sessionRenewal } from "./session-renewal";

function setUp(renew: () => Promise<unknown> = async () => undefined) {
  let at = 0;
  const spy = vi.fn(renew);
  const renewal = sessionRenewal(spy, () => at);
  return { renewal, spy, wait: (ms: number) => { at += ms; } };
}

describe("sessionRenewal", () => {
  it("renews at the first check, since the page cannot tell how old its cookie is", async () => {
    const { renewal, spy } = setUp();
    await renewal.check(true);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("waits a full interval before it renews again", async () => {
    const { renewal, spy, wait } = setUp();
    await renewal.check(true);
    wait(RENEW_EVERY_MS - 1);
    await renewal.check(true);
    expect(spy).toHaveBeenCalledTimes(1);
    wait(1);
    await renewal.check(true);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("does nothing while the tab is hidden", async () => {
    const { renewal, spy } = setUp();
    await renewal.check(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it("tries again at the next check after a renewal fails", async () => {
    const { renewal, spy } = setUp(async () => { throw new Error("offline"); });
    await renewal.check(true);
    await renewal.check(true);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("runs one renewal at a time", async () => {
    let finish: () => void = () => undefined;
    const { renewal, spy } = setUp(() => new Promise<void>((done) => { finish = done; }));
    const first = renewal.check(true);
    await renewal.check(true);
    finish();
    await first;
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
