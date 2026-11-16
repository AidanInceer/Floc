import { appRouter } from "@floc/api/router";
import type { Context } from "@floc/api/port";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { webPort } from "@/server/api-port/api-port";
import { auth } from "@/server/auth/auth";
import { memberSession } from "@/server/auth/member-session";
import { boundedRequest } from "@/server/http/request-body";
import { reportTrpcError } from "@/server/observability/request-error";
import { withRequestScope } from "@/server/request-scope";

export const dynamic = "force-dynamic";

async function createContext(req: Request): Promise<Context> {
  const session = memberSession(await auth.api.getSession({ headers: req.headers }));
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
      onError: reportTrpcError,
    }),
  );
}

export { handler as GET, handler as POST };
