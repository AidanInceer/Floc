/**
 * The typed client for `@floc/api` (ticket 289).
 *
 * `AppRouter` is imported as a TYPE. No server code crosses into the bundle —
 * if this import ever stops saying `import type`, the app would try to pull
 * the database layer onto a phone.
 *
 * The cache is React Query's, chosen because it can be persisted to disk
 * later without changing a single call site — that is what on-trip mode
 * (#226) will need. It is deliberately NOT persisted yet: a plan cached on a
 * device with no way to invalidate it is worse than no plan, and offline is
 * its own ticket.
 */
import type { AppRouter } from "@floc/api/router";
import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";

import { authHeaders } from "./auth";
import { TRPC_URL } from "./config";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A trip is edited by other people while you are looking at it, and
      // last-write-wins (rule 7) means the screen is only ever as fresh as its
      // last read. Thirty seconds is short enough to feel live and long
      // enough to survive a tab switch without a refetch storm.
      staleTime: 30_000,
      retry: 2,
    },
  },
});

const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: TRPC_URL,
      // Read per request, not captured — see `authHeaders`.
      headers: () => authHeaders(),
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({ client, queryClient });
