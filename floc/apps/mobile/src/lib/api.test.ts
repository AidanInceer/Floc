import { describe, expect, it, vi } from "vitest";

const listeners: ((state: string) => void)[] = [];
const setFocused = vi.fn();
const httpBatchLink = vi.fn((options: { url: string; headers: () => unknown; fetch?: unknown }) => options);
const authHeaders = vi.fn(async () => ({ Cookie: "s=1" }));

vi.mock("react-native", () => ({
  AppState: { addEventListener: (_: string, listener: (state: string) => void) => listeners.push(listener) },
}));
type CacheOptions = { onError: (error: unknown) => void };
vi.mock("@tanstack/react-query", () => ({
  QueryClient: class {
    constructor(public options: unknown) {}
  },
  QueryCache: class {
    constructor(public config: CacheOptions) {}
  },
  MutationCache: class {
    constructor(public config: CacheOptions) {}
  },
  focusManager: { setFocused },
}));
const reportSessionEnded = vi.fn();
vi.mock("./session/session-ended", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./session/session-ended")>()),
  reportSessionEnded,
}));
vi.mock("@trpc/client", () => ({
  createTRPCClient: vi.fn((options: unknown) => options),
  httpBatchLink,
}));
vi.mock("@trpc/tanstack-react-query", () => ({
  createTRPCOptionsProxy: vi.fn((options: unknown) => options),
}));
vi.mock("./auth", () => ({ authHeaders }));
vi.mock("./config", () => ({ TRPC_URL: "http://dev.test:3000/api/trpc" }));

const { queryClient, trpc } = await import("./api");

describe("the client", () => {
  it("re-reads a trip on a tick, and not in the background", () => {
    const { defaultOptions } = (queryClient as unknown as { options: { defaultOptions: { queries: Record<string, unknown> } } }).options;
    expect(defaultOptions.queries).toMatchObject({ staleTime: 30_000, refetchInterval: 30_000 });
    expect(defaultOptions.queries.refetchIntervalInBackground).toBeUndefined();
  });

  it("batches to the tRPC URL and shares the query client", () => {
    expect(httpBatchLink).toHaveBeenCalledWith(expect.objectContaining({ url: "http://dev.test:3000/api/trpc" }));
    expect((trpc as unknown as { queryClient: unknown }).queryClient).toBe(queryClient);
  });

  it("reads the auth headers per request", async () => {
    const [{ headers }] = httpBatchLink.mock.calls[0];
    authHeaders.mockClear();
    await headers();
    await headers();
    expect(authHeaders).toHaveBeenCalledTimes(2);
  });
});

describe("focus", () => {
  it("follows the app coming to the front and going away", () => {
    expect(listeners).toHaveLength(1);
    listeners[0]("active");
    expect(setFocused).toHaveBeenLastCalledWith(true);
    listeners[0]("background");
    expect(setFocused).toHaveBeenLastCalledWith(false);
  });
});

describe("a session the server refuses", () => {
  const options = (queryClient as unknown as {
    options: { queryCache: { config: CacheOptions }; defaultOptions: { queries: { retry: (count: number, error: unknown) => boolean } } };
  }).options;
  const refused = { data: { code: "UNAUTHORIZED", httpStatus: 401 } };

  it("ends the session on a refused read", () => {
    reportSessionEnded.mockClear();
    options.queryCache.config.onError(refused);
    expect(reportSessionEnded).toHaveBeenCalledTimes(1);
  });

  it("does not end it for any other failure", () => {
    reportSessionEnded.mockClear();
    options.queryCache.config.onError(new Error("Network request failed"));
    expect(reportSessionEnded).not.toHaveBeenCalled();
  });

  it("does not retry a refused read, but retries a flaky one twice", () => {
    const { retry } = options.defaultOptions.queries;
    expect(retry(0, refused)).toBe(false);
    expect(retry(1, new Error("flaky"))).toBe(true);
    expect(retry(2, new Error("flaky"))).toBe(false);
  });
});

describe("the session cookie", () => {
  it("is sent only by hand, never from the platform's cookie store", async () => {
    const fetchSpy = vi.fn(async () => new Response("[]"));
    vi.stubGlobal("fetch", fetchSpy);
    const [options] = httpBatchLink.mock.calls[0] as unknown as [{ fetch: (url: string, init: RequestInit) => Promise<Response> }];
    await options.fetch("http://dev.test:3000/api/trpc/x", { headers: { Cookie: "better-auth.session_token=t" } });
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://dev.test:3000/api/trpc/x",
      expect.objectContaining({ credentials: "omit", headers: { Cookie: "better-auth.session_token=t" } }),
    );
    vi.unstubAllGlobals();
  });
});
