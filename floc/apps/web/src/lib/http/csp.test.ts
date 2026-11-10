import { describe, expect, it } from "vitest";

import { contentSecurityPolicy, NONCE_HEADER } from "./csp";

const part = (policy: string, name: string) => policy.split("; ").find((d) => d.startsWith(`${name} `));

describe("contentSecurityPolicy (#582)", () => {
  it("runs only scripts that carry this response's nonce, and no inline script without it", () => {
    const policy = contentSecurityPolicy({ nonce: "abc123", host: "floc.live", dev: false });
    expect(part(policy, "script-src")).toBe("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(policy).not.toContain("unsafe-eval");
  });

  it("loads and connects to Floc only, the notes socket included", () => {
    const policy = contentSecurityPolicy({ nonce: "abc123", host: "floc.live", dev: false });
    expect(part(policy, "default-src")).toBe("default-src 'self'");
    expect(part(policy, "connect-src")).toBe("connect-src 'self' wss://floc.live");
    expect(part(policy, "img-src")).toBe("img-src 'self' data: blob:");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("form-action 'self'");
    expect(policy).toContain("base-uri 'self'");
  });

  it("lets the dev server evaluate and reach its own socket", () => {
    const policy = contentSecurityPolicy({ nonce: "abc123", host: "localhost:3000", dev: true });
    expect(part(policy, "script-src")).toContain("'unsafe-eval'");
    expect(part(policy, "connect-src")).toBe("connect-src 'self' ws://localhost:3000 wss://localhost:3000");
  });

  it("falls back to inline scripts where no nonce can be made, so a page never goes blank", () => {
    const policy = contentSecurityPolicy({ nonce: null, host: null, dev: false });
    expect(part(policy, "script-src")).toBe("script-src 'self' 'unsafe-inline'");
    expect(part(policy, "connect-src")).toBe("connect-src 'self'");
  });

  it("names the header the layout reads the nonce from", () => {
    expect(NONCE_HEADER).toBe("x-nonce");
  });
});
