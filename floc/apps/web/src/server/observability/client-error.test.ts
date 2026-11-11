import { describe, expect, it } from "vitest";

import { capturedLog } from "@/test/captured-log";

import { MAX_CLIENT_ERROR_BYTES, readClientError, reportClientError } from "./client-error";

describe("readClientError", () => {
  it("keeps the error type, message and route", () => {
    const report = readClientError(JSON.stringify({ errorType: "TypeError", message: "x is undefined", route: "/trip/42" }));
    expect(report).toEqual({ errorType: "TypeError", message: "x is undefined", route: "/trip/42" });
  });

  it("drops any other field the browser sends", () => {
    const report = readClientError(JSON.stringify({ errorType: "Error", message: "m", route: "/", email: "sam@example.com" }));
    expect(report).not.toHaveProperty("email");
  });

  it("refuses a body that is not a report", () => {
    expect(readClientError("not json")).toBeNull();
    expect(readClientError(JSON.stringify({ message: 4 }))).toBeNull();
    expect(readClientError(JSON.stringify(["a"]))).toBeNull();
  });

  it("refuses a body past the size cap", () => {
    const big = JSON.stringify({ errorType: "Error", message: "a".repeat(MAX_CLIENT_ERROR_BYTES), route: "/" });
    expect(readClientError(big)).toBeNull();
  });
});

describe("reportClientError", () => {
  it("logs a warning with the masked route and a scrubbed message", () => {
    const [line] = capturedLog(() =>
      reportClientError({ errorType: "TypeError", message: "failed for sam@example.com", route: "/trip/42/files?token=abc" }),
    );
    expect(line).toMatchObject({
      message: "client.error",
      level: "warn",
      errorType: "TypeError",
      errorMessage: "failed for [email]",
      route: "/trip/[id]/files",
    });
    expect(JSON.stringify(line)).not.toContain("token=abc");
  });
});
