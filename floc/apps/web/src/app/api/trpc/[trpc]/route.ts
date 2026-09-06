/**
 * Where the API is actually served (ticket 287).
 *
 * One handler, two callers. A browser arrives with the session cookie it
 * already had; a phone arrives with a bearer token (the `bearer` plugin in
 * `server/auth.ts`). Better Auth reads both off the same headers, so nothing
 * here has to know which it is talking to — and there is exactly one session
 * model behind both.
 *
 * The web app does not call this. Its pages read through Server Components and
 * write through Server Actions, exactly as before; this route exists so that
 * something which is *not* the web app can read a trip. Adding it takes
 * nothing away from the pages.
 */
import { appRouter } from "@floc/api/router";
import type { Context } from "@floc/api/port";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { webPort } from "@/server/api-port";
import { auth } from "@/server/auth";

/** libSQL over HTTP, and a session read per request — nothing here is static. */
export const dynamic = "force-dynamic";

async function createContext(req: Request): Promise<Context> {
  const session = await auth.api.getSession({ headers: req.headers });
  return {
    viewer: session?.user
      ? {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image ?? null,
        }
      : null,
    port: webPort,
  };
}

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    /**
     * A thrown message could be a database error naming a column. Clients get
     * tRPC's own code and message; the detail stays in the server log, where
     * it is useful and not a disclosure.
     */
    onError({ error, path }) {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        console.error(`tRPC ${path ?? "<no path>"}:`, error.cause ?? error);
      }
    },
  });
}

export { handler as GET, handler as POST };
