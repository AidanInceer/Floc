import { describe, expect, it, vi } from "vitest";

const listeners: ((state: string) => void)[] = [];
const setFocused = vi.fn();
const httpBatchLink = vi.fn((options: { url: string; headers: () => unknown }) => options);
const authHeaders = vi.fn(async () => ({ Cookie: "s=1" }));

vi.mock("react-native", () => ({
  AppState: { addEventListener: (_: string, listener: (state: string) => void) => listeners.push(listener) },
}));
vi.mock("@tanstack/react-query", () => ({
  QueryClient: class {
    constructor(public options: unknown) {}
  },
  focusManager: { setFocused },
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
    expect(defaultOptions.queries).toMatchObject({ staleTime: 15_000, refetchInterval: 15_000 });
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
