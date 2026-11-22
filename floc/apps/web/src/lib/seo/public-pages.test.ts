import { describe, expect, it } from "vitest";

import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";

import { PRIVATE_PREFIXES, authMetadata, indexablePaths, publicMetadata, robotsTxt, sitemapSections, sitemapXml } from "./public-pages";

const BASE = "https://floc.example";

describe("indexablePaths", () => {
  const paths = indexablePaths();

  it("lists the landing page, Explore, sign in, sign up and the legal pages", () => {
    for (const path of ["/", "/explore", "/login", "/signup", "/terms", "/privacy", "/cookies", "/contact", "/legal"]) {
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

  it("lets crawlers reach sign in and sign up", () => {
    expect(text).not.toContain("Disallow: /login");
    expect(text).not.toContain("Disallow: /signup");
  });

  it("disallows trip, invite, password, account and settings routes", () => {
    for (const path of ["/trip", "/trips", "/invite", "/forgot-password", "/reset-password", "/settings", "/profile", "/api"]) {
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

describe("authMetadata", () => {
  const page = { path: "/signup", title: "Sign up", description: "Start planning." };

  it("indexes the plain page at its canonical url", () => {
    const meta = authMetadata(page, undefined);
    expect(meta.robots).toEqual({ index: true, follow: true });
    expect(meta.alternates?.canonical).toBe("/signup");
  });

  it("keeps a page that carries an invite redirect out of search", () => {
    const meta = authMetadata(page, "/invite/secret-token");
    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(meta.alternates).toBeUndefined();
    expect(meta.openGraph).toBeUndefined();
  });

  it("keeps a page with an empty redirect out of search", () => {
    expect(authMetadata(page, "").robots).toEqual({ index: false, follow: false });
  });
});

describe("sitemapSections", () => {
  const sections = sitemapSections();
  const links = sections.flatMap((section) => section.links);

  it("leaves sign in and sign up off the visible list", () => {
    const paths = links.map((link) => link.path);
    expect(paths).not.toContain("/login");
    expect(paths).not.toContain("/signup");
  });

  it("lists the same pages as sitemap.xml, apart from itself, sign in and sign up", () => {
    const onPage = new Set([...links.map((link) => link.path), "/sitemap", "/login", "/signup"]);
    expect(onPage).toEqual(new Set(indexablePaths()));
  });

  it("names every Explore trip by its title, not its address", () => {
    for (const trip of PRESET_TRIPS) {
      expect(links).toContainEqual({ path: `/explore/${trip.id}`, label: trip.title });
    }
  });

  it("names the static pages in words", () => {
    expect(links).toContainEqual({ path: "/", label: "Home" });
    expect(links).toContainEqual({ path: "/terms", label: "Terms of use" });
  });

  it("holds no private page", () => {
    for (const { path } of links) {
      for (const prefix of PRIVATE_PREFIXES) expect(path === prefix || path.startsWith(`${prefix}/`)).toBe(false);
    }
  });
});
