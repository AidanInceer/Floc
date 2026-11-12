import { afterEach, expect, it, vi } from "vitest";

import { GET } from "./route";

afterEach(() => vi.unstubAllEnvs());

it("serves robots rules as plain text that point crawlers at the site's sitemap", async () => {
  vi.stubEnv("BETTER_AUTH_URL", "https://floc.example");
  const response = GET();
  expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
  expect(await response.text()).toContain("Sitemap: https://floc.example/sitemap.xml");
});
