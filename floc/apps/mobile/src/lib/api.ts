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
      headers: () => authHeaders(),
      fetch: (url, init) => fetch(url, { ...init, credentials: "omit" }),
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({ client, queryClient });

AppState.addEventListener("change", (state) => {
  focusManager.setFocused(state === "active");
});
