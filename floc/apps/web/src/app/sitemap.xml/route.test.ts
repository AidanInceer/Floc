import { afterEach, expect, it, vi } from "vitest";

import { GET } from "./route";

afterEach(() => vi.unstubAllEnvs());

it("serves the sitemap as XML with absolute urls on the site's own address", async () => {
  vi.stubEnv("BETTER_AUTH_URL", "https://floc.example");
  const response = GET();
  expect(response.headers.get("Content-Type")).toBe("application/xml; charset=utf-8");
  expect(await response.text()).toContain("<loc>https://floc.example/explore</loc>");
});
