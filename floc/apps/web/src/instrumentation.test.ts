import { afterEach, describe, expect, it, vi } from "vitest";

const spies = vi.hoisted(() => ({ startTracing: vi.fn(), reportRequestError: vi.fn() }));
vi.mock("./server/observability/tracing", () => ({ startTracing: spies.startTracing }));
vi.mock("./server/observability/request-error", () => ({ reportRequestError: spies.reportRequestError }));

import { onRequestError, register } from "./instrumentation";

const request = { path: "/trips", method: "GET", headers: {} };
const context = { routerKind: "App Router", routePath: "/trips", routeType: "render", renderSource: "react-server-components", revalidateReason: undefined } as const;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("instrumentation", () => {
  it("starts tracing on the Node runtime only", async () => {
    vi.stubEnv("NEXT_RUNTIME", "edge");
    await register();
    expect(spies.startTracing).not.toHaveBeenCalled();
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    await register();
    expect(spies.startTracing).toHaveBeenCalledWith(process.env);
  });

  it("reports a request error on the Node runtime only", async () => {
    const error = new Error("boom");
    vi.stubEnv("NEXT_RUNTIME", "edge");
    await onRequestError(error, request, context);
    expect(spies.reportRequestError).not.toHaveBeenCalled();
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    await onRequestError(error, request, context);
    expect(spies.reportRequestError).toHaveBeenCalledWith(error, request, context);
  });
});
