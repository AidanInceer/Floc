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
import { QueryClient, focusManager } from "@tanstack/react-query";
import { AppState } from "react-native";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";

import { authHeaders } from "./auth";
import { TRPC_URL } from "./config";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A trip is edited by other people while you are looking at it, and
      // last-write-wins (rule 7) means the screen is only ever as fresh as its
      // last read — so it re-reads on a tick rather than waiting to be asked.
      // Fifteen seconds: fast enough that a trip deleted in a browser leaves
      // the phone while you are still looking at it, slow enough that a group
      // of six is not a load test. `refetchIntervalInBackground` stays off, so
      // a pocketed phone asks nothing.
      staleTime: 15_000,
      refetchInterval: 15_000,
      refetchOnWindowFocus: true,
      retry: 2,
    },
  },
});

export const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: TRPC_URL,
      // Read per request, not captured — see `authHeaders`.
      headers: () => authHeaders(),
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({ client, queryClient });

/**
 * React Query's idea of "focused" is a browser tab. On a phone it is the app
 * being in front of you, and without this it is focused forever — so nothing
 * refetched on coming back, and the polling above would run in your pocket.
 */
AppState.addEventListener("change", (state) => {
  focusManager.setFocused(state === "active");
});
