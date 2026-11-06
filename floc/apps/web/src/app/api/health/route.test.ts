import { afterEach, expect, it, vi } from "vitest";
import { GET } from "./route";

afterEach(() => vi.unstubAllEnvs());
it("identifies the running revision without exposing deployment credentials", async () => {
  vi.stubEnv("RAILWAY_GIT_COMMIT_SHA", "deployed-revision");
  vi.stubEnv("RAILWAY_TOKEN", "private-value");
  const response = GET();
  expect(await response.json()).toEqual({ status: "ok", sha: "deployed-revision" });
  expect(response.headers.get("Cache-Control")).toBe("no-store");
});

it("reports an explicit unknown revision locally", async () => {
  vi.stubEnv("RAILWAY_GIT_COMMIT_SHA", undefined);
  vi.stubEnv("FLOC_COMMIT_SHA", undefined);
  expect(await GET().json()).toEqual({ status: "ok", sha: null });
  vi.stubEnv("FLOC_COMMIT_SHA", "local-build");
  expect(await GET().json()).toEqual({ status: "ok", sha: "local-build" });
});
