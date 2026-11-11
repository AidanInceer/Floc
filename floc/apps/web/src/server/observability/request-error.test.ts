import { describe, expect, it } from "vitest";

import { capturedLog } from "@/test/captured-log";

import { reportRequestError, reportTrpcError } from "./request-error";

const request = { path: "/trip/42/files/7?token=abc", method: "POST", headers: {} };
const context = { routerKind: "App Router", routePath: "/trip/[id]/files/[docId]", routeType: "action" } as const;

describe("reportRequestError", () => {
  it("logs the error with the route, never the raw path", () => {
    const [line] = capturedLog(() => reportRequestError(new TypeError("boom for sam@example.com"), request, context));
    expect(line).toMatchObject({
      message: "request.error",
      level: "error",
      route: "/trip/[id]/files/[docId]",
      routeType: "action",
      method: "POST",
      errorType: "TypeError",
      errorMessage: "boom for [email]",
    });
    expect(JSON.stringify(line)).not.toContain("token=abc");
  });

  it("falls back to the masked path when Next gives no route", () => {
    const [line] = capturedLog(() => reportRequestError(new Error("x"), request, { ...context, routePath: "" }));
    expect(line).toMatchObject({ route: "/trip/[id]/files/[docId]" });
  });

  it("logs an old page calling a removed server action as a warning, not an error", () => {
    const stale = new Error('Failed to find Server Action "7f3a". This request might be from an older or newer deployment.');
    const [line] = capturedLog(() => reportRequestError(stale, request, context));
    expect(line).toMatchObject({ message: "action.stale", level: "warn" });
  });
});

describe("reportTrpcError", () => {
  const dbError = new Error("Failed query: select * from user where email = ? params: sam@example.com");

  it("logs a server fault with the procedure and the cause, without the query values", () => {
    const error = Object.assign(new Error("Internal"), { code: "INTERNAL_SERVER_ERROR", cause: dbError });
    const [line] = capturedLog(() => reportTrpcError({ error, path: "trip.byId" }));
    expect(line).toMatchObject({ message: "trpc.error", level: "error", procedure: "trip.byId", code: "INTERNAL_SERVER_ERROR" });
    expect(JSON.stringify(line)).not.toContain("sam@example.com");
  });

  it("writes nothing for a caller's own mistake", () => {
    const error = Object.assign(new Error("Not yours"), { code: "FORBIDDEN" });
    expect(capturedLog(() => reportTrpcError({ error, path: "trip.byId" }))).toEqual([]);
  });
});
