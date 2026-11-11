import { describe, expect, it } from "vitest";

import pkg from "../../../package.json" with { type: "json" };
import { capturedLog } from "@/test/captured-log";

import { log } from "./log";
import { withRequestContext } from "./request-context";

describe("log", () => {
  it("writes one JSON line with message, level and release", () => {
    const [line] = capturedLog(() => log.info("floc-web ready", { port: 3000 }));
    expect(line).toEqual({ message: "floc-web ready", level: "info", release: pkg.version, port: 3000 });
  });

  it("adds the request id inside a request", () => {
    const [line] = capturedLog(() => withRequestContext({ requestId: "req-abc-123" }, () => log.warn("slow")));
    expect(line).toMatchObject({ level: "warn", requestId: "req-abc-123" });
  });

  it("never writes personal data, even when a caller passes it", () => {
    const [line] = capturedLog(() => log.error("sign-in failed for sam@example.com", { email: "sam@example.com", route: "/login" }));
    expect(JSON.stringify(line)).not.toContain("sam");
    expect(line).toMatchObject({ message: "sign-in failed for [email]", level: "error", route: "/login" });
  });

  it("keeps its own fields when a caller passes the same keys", () => {
    const [line] = capturedLog(() => log.info("x", { level: "error", release: "fake", requestId: "fake" }));
    expect(line).toMatchObject({ level: "info", release: pkg.version });
    expect(line.requestId).toBeUndefined();
  });
});
