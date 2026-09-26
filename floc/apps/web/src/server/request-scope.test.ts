import { describe, expect, it, vi } from "vitest";

import { forgetRequestReads, requestMemo, withRequestScope } from "@/server/request-scope";

describe("the request memo", () => {
  it("loads once per key inside a request", async () => {
    const load = vi.fn(async () => 1);
    await withRequestScope(async () => {
      await requestMemo("a", load);
      await requestMemo("a", load);
    });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("loads every time outside a request", async () => {
    const load = vi.fn(async () => 1);
    await requestMemo("a", load);
    await requestMemo("a", load);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("loads again after a write", async () => {
    const load = vi.fn(async () => 1);
    await withRequestScope(async () => {
      await requestMemo("a", load);
      forgetRequestReads();
      await requestMemo("a", load);
    });
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("does not share across requests", async () => {
    const load = vi.fn(async () => 1);
    await withRequestScope(() => requestMemo("a", load));
    await withRequestScope(() => requestMemo("a", load));
    expect(load).toHaveBeenCalledTimes(2);
  });
});
