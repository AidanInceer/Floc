import { describe, expect, it } from "vitest";

import { Refusal, isRefusal, orRefusal } from "./refusal";

describe("work that may be refused", () => {
  it("answers with what the work returned, or nothing to say", async () => {
    expect(await orRefusal(() => Promise.resolve({ id: 4 }))).toEqual({ id: 4 });
    expect(await orRefusal(() => Promise.resolve())).toEqual({});
  });

  it("answers a refusal with its words", async () => {
    expect(await orRefusal(() => Promise.reject(new Refusal("Give your name first.")))).toEqual({ error: "Give your name first." });
  });

  it("lets any other error through", async () => {
    await expect(orRefusal(() => Promise.reject(new Error("db down")))).rejects.toThrow("db down");
  });
});

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
