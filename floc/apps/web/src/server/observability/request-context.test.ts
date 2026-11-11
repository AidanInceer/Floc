import { describe, expect, it } from "vitest";

import { currentRequestId, requestIdFrom, withRequestContext } from "./request-context";

describe("requestIdFrom", () => {
  it("keeps the edge's request id", () => {
    expect(requestIdFrom("Kc2wQ-9xT_aB3dEf")).toBe("Kc2wQ-9xT_aB3dEf");
  });

  it("makes a new id when there is none", () => {
    expect(requestIdFrom(undefined)).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("makes a new id when the header is not an id", () => {
    expect(requestIdFrom("<script>alert(1)</script>")).toMatch(/^[0-9a-f-]{36}$/);
    expect(requestIdFrom("short")).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("takes the first of repeated headers", () => {
    expect(requestIdFrom(["first-id-123", "second-id-456"])).toBe("first-id-123");
  });
});

describe("withRequestContext", () => {
  it("gives the request id to code awaited inside it", async () => {
    const seen = await withRequestContext({ requestId: "req-abc-123" }, async () => {
      await Promise.resolve();
      return currentRequestId();
    });
    expect(seen).toBe("req-abc-123");
  });

  it("has no request id outside a request", () => {
    expect(currentRequestId()).toBeUndefined();
  });
});
