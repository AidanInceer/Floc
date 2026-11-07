/**
 * The typed client for `@floc/api` (#289).
 *
 * Why: `AppRouter` is an `import type` — drop that and the app pulls the database layer onto a
 * phone. React Query so on-trip mode (#226) can persist the cache later without touching a call
 * site; not persisted yet, because a plan cached with no way to invalidate it is worse than none.
 */
import type { AppRouter } from "@floc/api/router";
import { MutationCache, QueryCache, QueryClient, focusManager } from "@tanstack/react-query";
import { AppState } from "react-native";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";

import { authHeaders } from "./auth";
import { TRPC_URL } from "./config";
import { isUnauthorized, reportSessionEnded } from "./session/session-ended";

const endIfRefused = (error: unknown) => {
  if (isUnauthorized(error)) reportSessionEnded();
};

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: endIfRefused }),
  mutationCache: new MutationCache({ onError: endIfRefused }),
  defaultOptions: {
    queries: {
      // Why: last-write-wins (rule 7) makes a screen only as fresh as its last read, so it
      // re-reads on a tick. Tabs stay mounted and every mounted query polls, so the tick is
      // slow; coming back to the app re-reads at once. Off for a pocketed phone.
      staleTime: 30_000,
      refetchInterval: 30_000,
      refetchOnWindowFocus: true,
      retry: (count, error) => !isUnauthorized(error) && count < 2,
    },
  },
});

export const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: TRPC_URL,
      // Read per request, not captured — see `authHeaders`.
      headers: () => authHeaders(),
      // Why: Android's cookie store kept a refreshed session_data cookie from a response and swapped it in for
      // the Cookie header above, dropping the token — every read was refused a minute after sign-in.
      fetch: (url, init) => fetch(url, { ...init, credentials: "omit" }),
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({ client, queryClient });

// Why: React Query's "focused" means a browser tab, so on a phone it is focused forever —
// nothing refetches on returning and the polling above runs in your pocket.
AppState.addEventListener("change", (state) => {
  focusManager.setFocused(state === "active");
});
