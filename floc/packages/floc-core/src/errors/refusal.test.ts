import { describe, expect, it } from "vitest";

import { Refusal, isRefusal } from "./refusal";

describe("a refusal", () => {
  it("is told apart from any other error", () => {
    expect(isRefusal(new Refusal("No."))).toBe(true);
    expect(isRefusal(new Error("No."))).toBe(false);
    expect(isRefusal("No.")).toBe(false);
  });

  it("is invalid input unless it says otherwise", () => {
    expect(new Refusal("No.").kind).toBe("invalid");
    expect(new Refusal("Gone.", "missing").kind).toBe("missing");
  });
});
