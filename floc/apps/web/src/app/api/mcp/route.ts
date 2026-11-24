import { requireMcpAuth } from "@better-auth/mcp";

import { AGENT_READ_SCOPE, agentKeysUrl, agentResourceUrl } from "@/server/auth/agent-access";
import { auth, AUTH_BASE_URL } from "@/server/auth/auth";
import { agentViewer } from "@/server/auth/connected-apps";
import { boundedRequest } from "@/server/http/request-body";
import { serveAgent } from "@/server/mcp/read-tools";
import { withRequestScope } from "@/server/request-scope";

export const dynamic = "force-dynamic";

const resource = agentResourceUrl(AUTH_BASE_URL);

function connectionEnded(resourceUrl: string): Response {
  const { origin, pathname } = new URL(resourceUrl);
  const metadata = `${origin}/.well-known/oauth-protected-resource${pathname}`;
  return Response.json(
    { jsonrpc: "2.0", error: { code: -32000, message: "This connection has ended. Connect again." }, id: null },
    { status: 401, headers: { "WWW-Authenticate": `Bearer error="invalid_token", resource_metadata="${metadata}"` } },
  );
}

const serve = resource
  ? requireMcpAuth(
      auth,
      async (request, claims) => {
        const viewer = await agentViewer(claims);
        if (!viewer) return connectionEnded(resource);
        return serveAgent(request, viewer);
      },
      { resource, jwksUrl: agentKeysUrl(resource), requiredScopes: [AGENT_READ_SCOPE] },
    )
  : null;

async function handler(req: Request) {
  if (!serve) return new Response("Not found", { status: 404 });
  const bounded = await boundedRequest(req);
  if (!bounded) return new Response("Request body is too large", { status: 413 });
  return withRequestScope(() => serve(bounded));
}

export { handler as DELETE, handler as GET, handler as POST };
