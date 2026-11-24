import { describe, expect, it, vi } from "vitest";

const handler = vi.hoisted(() => vi.fn(async () => Response.json({ served: "resource" })));

vi.mock("@/server/auth/auth", () => ({ auth: { handler } }));
vi.mock("@better-auth/oauth-provider", () => ({
  oauthProviderAuthServerMetadata: () => () => Response.json({ served: "auth-server" }),
  oauthProviderOpenIdConfigMetadata: () => () => Response.json({ served: "openid" }),
}));

const read = async (response: Response | Promise<Response>) => ((await (await response).json()) as { served: string }).served;

describe("how an agent finds Floc's sign-in (#354)", () => {
  it("answers for the protected resource through Better Auth", async () => {
    const { GET } = await import("@/app/.well-known/oauth-protected-resource/api/mcp/route");
    const request = new Request("https://floc.test/.well-known/oauth-protected-resource/api/mcp");
    expect(await read(GET(request))).toBe("resource");
    expect(handler).toHaveBeenCalledWith(request);
  });

  it("answers for the authorization server", async () => {
    const { GET } = await import("@/app/.well-known/oauth-authorization-server/api/auth/route");
    expect(await read(GET(new Request("https://floc.test/.well-known/oauth-authorization-server/api/auth")))).toBe("auth-server");
  });

  it("answers for OpenID discovery", async () => {
    const { GET } = await import("@/app/.well-known/openid-configuration/api/auth/route");
    expect(await read(GET(new Request("https://floc.test/.well-known/openid-configuration/api/auth")))).toBe("openid");
  });
});
