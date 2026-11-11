import { describe, expect, it, vi } from "vitest";

import { clientErrorBeacon } from "./beacon";

const sent = (send: ReturnType<typeof vi.fn>) => send.mock.calls.map(([body]) => JSON.parse(String(body)));

describe("clientErrorBeacon", () => {
  it("sends the error type, message and page path", () => {
    const send = vi.fn();
    clientErrorBeacon(send, () => "/trip/42").report(new TypeError("x is undefined"));
    expect(sent(send)).toEqual([{ errorType: "TypeError", message: "x is undefined", route: "/trip/42" }]);
  });

  it("reports a rejected promise that is not an Error", () => {
    const send = vi.fn();
    clientErrorBeacon(send, () => "/").report("plain string");
    expect(sent(send)[0]).toMatchObject({ errorType: "string", message: "plain string" });
  });

  it("sends the same error once", () => {
    const send = vi.fn();
    const beacon = clientErrorBeacon(send, () => "/");
    beacon.report(new Error("loop"));
    beacon.report(new Error("loop"));
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("stops after five errors on one page load", () => {
    const send = vi.fn();
    const beacon = clientErrorBeacon(send, () => "/");
    for (let i = 0; i < 8; i++) beacon.report(new Error(`e${i}`));
    expect(send).toHaveBeenCalledTimes(5);
  });
});
