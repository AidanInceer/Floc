/**
 * Where the API is actually served (ticket 287).
 *
 * One handler, two callers. A browser arrives with the session cookie it
 * already had; a phone arrives with a bearer token (the `bearer` plugin in
 * `server/auth/auth.ts`). Better Auth reads both off the same headers, so nothing
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

import { webPort } from "@/server/api-port/api-port";
import { auth } from "@/server/auth/auth";
import { boundedRequest } from "@/server/http/request-body";
import { withRequestScope } from "@/server/request-scope";

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

async function handler(req: Request) {
  const bounded = await boundedRequest(req);
  if (!bounded) {
    return new Response("Request body is too large", { status: 413 });
  }
  return withRequestScope(() =>
    fetchRequestHandler({
      endpoint: "/api/trpc",
      req: bounded,
      router: appRouter,
      createContext: () => createContext(req),
      onError({ error, path }) {
        if (error.code === "INTERNAL_SERVER_ERROR") {
          // Database errors can include query parameters containing PII.
          console.error(`tRPC ${path ?? "<no path>"}: ${error.code}`);
        }
      },
    }),
  );
}

export { handler as GET, handler as POST };
