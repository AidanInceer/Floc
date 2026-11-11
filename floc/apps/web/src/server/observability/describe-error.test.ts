import { describe, expect, it } from "vitest";

import { describeError } from "./describe-error";

describe("describeError", () => {
  it("cuts a failed query at its params, so no value reaches the log", () => {
    const err = new Error('Failed query: select "id" from "user" where "email" = ?\nparams: sam@example.com');
    const fields = describeError(err);
    expect(fields.errorMessage).toBe('Failed query: select "id" from "user" where "email" = ?');
    expect(JSON.stringify(fields)).not.toContain("sam");
  });

  it("keeps the type, a scrubbed message and the first stack frames", () => {
    const err = new TypeError("no trip for sam@example.com");
    err.stack = ["TypeError: no trip", ...Array.from({ length: 10 }, (_, i) => `    at frame${i} (/app/x.js:1:${i})`)].join("\n");
    const fields = describeError(err);
    expect(fields.errorType).toBe("TypeError");
    expect(fields.errorMessage).toBe("no trip for [email]");
    expect(String(fields.errorStack).split(" | ")).toHaveLength(6);
    expect(fields.errorStack).toMatch(/^at frame0/);
  });

  it("names the cause, cut the same way", () => {
    const err = new Error("Failed query: insert\nparams: x", { cause: new Error("SQLITE_CONSTRAINT: UNIQUE failed\nparams: y") });
    expect(describeError(err).errorCause).toBe("SQLITE_CONSTRAINT: UNIQUE failed");
  });

  it("keeps a Next digest and a string code", () => {
    const err = Object.assign(new Error("boom"), { digest: "1234567", code: "SQLITE_BUSY" });
    expect(describeError(err)).toMatchObject({ digest: "1234567", errorCode: "SQLITE_BUSY" });
  });

  it("says only the kind of a thrown value that is not an Error", () => {
    expect(describeError("sam@example.com")).toEqual({ errorType: "string" });
  });
});
