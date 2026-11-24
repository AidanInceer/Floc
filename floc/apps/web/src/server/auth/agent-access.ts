import "server-only";

import { cimd } from "@better-auth/cimd";
import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import { mcp } from "@better-auth/mcp";
import type { BetterAuthPlugin } from "better-auth";
import { jwt } from "better-auth/plugins";

export const AGENT_READ_SCOPE = "floc:read";
export const AGENT_TOKEN_SECONDS = 15 * 60;

export const AGENT_CLOSED_PATHS = [
  "/token",
  "/oauth2/register",
  "/oauth2/create-client",
  "/oauth2/get-client",
  "/oauth2/get-clients",
  "/oauth2/update-client",
  "/oauth2/delete-client",
  "/oauth2/client/rotate-secret",
  "/oauth2/client/rotate-keys",
  "/oauth2/public-client",
  "/oauth2/public-client-prelogin",
  "/oauth2/get-consent",
  "/oauth2/get-consents",
  "/oauth2/update-consent",
  "/oauth2/delete-consent",
];

const CONNECT_PAGE = "/connect";
const AGENT_PATH = "/api/mcp";

export function agentResourceUrl(baseUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    return null;
  }
  const namedLocal = url.hostname.endsWith(".localhost");
  const local = namedLocal || url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !local) return null;
  const host = namedLocal ? "localhost" : url.hostname;
  return `${url.protocol}//${host}${url.port ? `:${url.port}` : ""}${AGENT_PATH}`;
}

export function agentKeysUrl(resourceUrl: string): string {
  return `${new URL(resourceUrl).origin}/api/auth/jwks`;
}

export function agentAccessPlugins(baseUrl: string) {
  const resource = agentResourceUrl(baseUrl);
  if (!resource) return [];
  return [
    jwt({ disableSettingJwtHeader: true }),
    mcp({
      loginPage: CONNECT_PAGE,
      consentPage: CONNECT_PAGE,
      resource,
      scopes: ["openid", "offline_access", AGENT_READ_SCOPE],
      clientRegistrationDefaultScopes: ["offline_access", AGENT_READ_SCOPE],
      accessTokenExpiresIn: AGENT_TOKEN_SECONDS,
      refreshTokenReuseInterval: 0,
    }),
    cimd({ fetchClientMetadataResource, metadataProfile: "mcp-2026-07-28" }),
  ];
}

export function withAgentAccess<Plugins extends BetterAuthPlugin[]>(baseUrl: string, core: [...Plugins]): [...Plugins] {
  return [...agentAccessPlugins(baseUrl), ...core] as unknown as [...Plugins];
}
