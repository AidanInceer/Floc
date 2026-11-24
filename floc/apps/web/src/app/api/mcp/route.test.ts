import { beforeEach, describe, expect, it, vi } from "vitest";

const door = vi.hoisted(() => ({
  baseUrl: "https://floc.test",
  claims: { sub: "u-member", azp: "https://agent.example/client.json" } as Record<string, unknown>,
  options: null as { resource?: string; jwksUrl?: string; requiredScopes?: readonly string[] } | null,
  agentViewer: vi.fn(),
  serveAgent: vi.fn(),
}));

vi.mock("@/server/auth/auth", () => ({
  auth: {},
  get AUTH_BASE_URL() {
    return door.baseUrl;
  },
}));
vi.mock("@better-auth/mcp", () => ({
  mcp: vi.fn(),
  requireMcpAuth: (_auth: unknown, handler: (request: Request, claims: unknown) => Promise<Response>, options: typeof door.options) => {
    door.options = options;
    return (request: Request) => handler(request, door.claims);
  },
}));
vi.mock("@/server/auth/connected-apps", () => ({ agentViewer: door.agentViewer }));
vi.mock("@/server/mcp/read-tools", () => ({ serveAgent: door.serveAgent }));

const VIEWER = { id: "u-member", name: "Mo", email: "mo@example.test", image: null };

async function loadRoute() {
  vi.resetModules();
  return import("./route");
}

const call = (headers: Record<string, string> = {}) =>
  new Request("https://floc.test/api/mcp", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: "{}" });

beforeEach(() => {
  door.baseUrl = "https://floc.test";
  door.options = null;
  door.agentViewer.mockReset();
  door.serveAgent.mockReset();
});

describe("the agent door (#354)", () => {
  it("asks for a read token bound to this address", async () => {
    await loadRoute();
    expect(door.options).toEqual({
      resource: "https://floc.test/api/mcp",
      jwksUrl: "https://floc.test/api/auth/jwks",
      requiredScopes: ["floc:read"],
    });
  });

  it("serves the person the token's consent names", async () => {
    door.agentViewer.mockResolvedValue(VIEWER);
    door.serveAgent.mockResolvedValue(new Response("served"));
    const { POST } = await loadRoute();
    const response = await POST(call());
    expect(await response.text()).toBe("served");
    expect(door.agentViewer).toHaveBeenCalledWith(door.claims);
    expect(door.serveAgent.mock.calls[0][1]).toEqual(VIEWER);
  });

  it("ends a disconnected app's token at once and tells it how to sign in again", async () => {
    door.agentViewer.mockResolvedValue(null);
    const { POST } = await loadRoute();
    const response = await POST(call());
    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toContain(
      'resource_metadata="https://floc.test/.well-known/oauth-protected-resource/api/mcp"',
    );
    expect(door.serveAgent).not.toHaveBeenCalled();
  });

  it("refuses a body that is too large before it reads who is asking", async () => {
    const { POST } = await loadRoute();
    const response = await POST(call({ "content-length": String(13 * 1024 * 1024) }));
    expect(response.status).toBe(413);
    expect(door.agentViewer).not.toHaveBeenCalled();
  });

  it("is not there without a safe address (rule 11)", async () => {
    door.baseUrl = "http://floc.live";
    const { POST } = await loadRoute();
    const response = await POST(call());
    expect(response.status).toBe(404);
    expect(door.options).toBeNull();
  });
});
