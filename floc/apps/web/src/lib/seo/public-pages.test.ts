import { describe, expect, it } from "vitest";

import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";

import { PRIVATE_PREFIXES, indexablePaths, publicMetadata, robotsTxt, sitemapXml } from "./public-pages";

const BASE = "https://floc.example";

describe("indexablePaths", () => {
  const paths = indexablePaths();

  it("lists the landing page, Explore and the legal pages", () => {
    for (const path of ["/", "/explore", "/terms", "/privacy", "/cookies", "/contact", "/legal"]) {
      expect(paths).toContain(path);
    }
  });

  it("lists every Explore trip", () => {
    for (const trip of PRESET_TRIPS) expect(paths).toContain(`/explore/${trip.id}`);
  });

  it("never lists a private page", () => {
    for (const path of paths) {
      for (const prefix of PRIVATE_PREFIXES) {
        expect(path === prefix || path.startsWith(`${prefix}/`)).toBe(false);
      }
    }
  });
});

describe("sitemapXml", () => {
  const xml = sitemapXml(BASE);

  it("is a sitemap of absolute urls", () => {
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);
    expect(xml).toContain(`<loc>${BASE}/explore</loc>`);
    expect(xml).toContain(`<loc>${BASE}/</loc>`);
  });

  it("holds no trip or invite url", () => {
    for (const path of ["/trip/", "/trips", "/invite"]) expect(xml).not.toContain(`${BASE}${path}`);
  });
});

describe("robotsTxt", () => {
  const text = robotsTxt(BASE);

  it("disallows trip, invite, auth, account and settings routes", () => {
    for (const path of ["/trip", "/trips", "/invite", "/login", "/signup", "/settings", "/profile", "/api"]) {
      expect(text).toContain(`Disallow: ${path}`);
    }
  });

  it("points at the sitemap", () => {
    expect(text).toContain(`Sitemap: ${BASE}/sitemap.xml`);
  });
});

describe("publicMetadata", () => {
  const meta = publicMetadata({ path: "/explore", title: "Explore", description: "Trips to borrow." });

  it("sets its own title, description and canonical url", () => {
    expect(meta.title).toBe("Explore");
    expect(meta.description).toBe("Trips to borrow.");
    expect(meta.alternates?.canonical).toBe("/explore");
  });

  it("carries an Open Graph and a Twitter card", () => {
    expect(meta.openGraph).toMatchObject({ title: "Explore · Floc", description: "Trips to borrow.", url: "/explore", siteName: "Floc" });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", title: "Explore · Floc" });
  });

  it("shows the wordmark card when shared", () => {
    expect(meta.openGraph?.images).toEqual([expect.objectContaining({ url: "/opengraph-image" })]);
    expect(meta.twitter?.images).toEqual(["/opengraph-image"]);
  });

  it("shows a page's own card when it has one", () => {
    const own = publicMetadata({ path: "/explore/x", title: "X", description: "D", card: "/explore/x/opengraph-image" });
    expect(own.openGraph?.images).toEqual([expect.objectContaining({ url: "/explore/x/opengraph-image" })]);
  });

  it("lets search engines index the page", () => {
    expect(meta.robots).toEqual({ index: true, follow: true });
  });
});
