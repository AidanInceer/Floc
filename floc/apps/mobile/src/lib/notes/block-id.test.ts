import { describe, expect, it } from "vitest";

import { newBlockId } from "./block-id";

describe("a new block id", () => {
  it("is a v4 uuid, different each time", () => {
    const id = newBlockId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(newBlockId()).not.toBe(id);
  });
});
