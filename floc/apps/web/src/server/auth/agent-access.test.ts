import { describe, expect, it } from "vitest";

import { AGENT_CLOSED_PATHS, AGENT_TOKEN_SECONDS, agentAccessPlugins, agentKeysUrl, agentResourceUrl } from "@/server/auth/agent-access";

describe("the address agents connect to (#354)", () => {
  it("is /api/mcp on the live site", () => {
    expect(agentResourceUrl("https://floc.live")).toBe("https://floc.live/api/mcp");
  });

  it("works on plain localhost", () => {
    expect(agentResourceUrl("http://localhost:3000")).toBe("http://localhost:3000/api/mcp");
  });

  it("uses localhost for a task worktree's named local host", () => {
    expect(agentResourceUrl("http://floc-abc.localhost:21760")).toBe("http://localhost:21760/api/mcp");
  });

  it("is refused over plain http on a real host", () => {
    expect(agentResourceUrl("http://floc.live")).toBeNull();
  });

  it("is refused for an address that is not a URL", () => {
    expect(agentResourceUrl("not a url")).toBeNull();
  });
});

describe("where the server finds its own signing keys (#354)", () => {
  it("is the auth path on the live site", () => {
    expect(agentKeysUrl("https://floc.live/api/mcp")).toBe("https://floc.live/api/auth/jwks");
  });

  it("is on localhost in a task worktree, whose named host Node cannot resolve", () => {
    expect(agentKeysUrl("http://localhost:21760/api/mcp")).toBe("http://localhost:21760/api/auth/jwks");
  });
});

describe("agent sign-in (#354)", () => {
  it("stays off rather than crash without a safe address (rule 11)", () => {
    expect(agentAccessPlugins("http://floc.live")).toEqual([]);
  });

  it("issues short tokens, so a lost one dies quickly", () => {
    expect(AGENT_TOKEN_SECONDS).toBe(15 * 60);
  });

  it("leaves open only the sign-in flow, so no member can register or change an app", () => {
    const provider = agentAccessPlugins("https://floc.live").find((plugin) => plugin.id === "oauth-provider")!;
    const endpoints = Object.values(provider.endpoints ?? {}) as { path: string; options?: { metadata?: { SERVER_ONLY?: boolean } } }[];
    const open = endpoints
      .filter((endpoint) => !endpoint.options?.metadata?.SERVER_ONLY)
      .map((endpoint) => endpoint.path)
      .filter((path) => !AGENT_CLOSED_PATHS.includes(path));
    expect([...new Set(open)].sort()).toEqual([
      "/oauth2/authorize",
      "/oauth2/consent",
      "/oauth2/continue",
      "/oauth2/end-session",
      "/oauth2/end-session/confirm",
      "/oauth2/introspect",
      "/oauth2/revoke",
      "/oauth2/token",
      "/oauth2/userinfo",
    ]);
  });

  it("adds the signing key, the provider and client discovery", () => {
    expect(agentAccessPlugins("https://floc.live").map((plugin) => plugin.id)).toEqual(["jwt", "oauth-provider", "cimd"]);
  });
});
