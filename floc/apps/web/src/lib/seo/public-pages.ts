import type { Metadata } from "next";

import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";

import { LEGAL_LINKS } from "@/lib/legal/legal-links";

type PublicLink = { path: string; label: string };
export type SitemapSection = { title: string; links: PublicLink[] };

const SITEMAP_PATH = "/sitemap";

const STATIC_PUBLIC_PAGES: PublicLink[] = [
  { path: "/", label: "Home" },
  { path: "/explore", label: "Explore" },
  ...LEGAL_LINKS.map(({ href, label }) => ({ path: href, label })),
];

const AUTH_PATHS = ["/login", "/signup"];

const EXPLORE_PAGES: PublicLink[] = PRESET_TRIPS.map((trip) => ({ path: `/explore/${trip.id}`, label: trip.title }));

export const PRIVATE_PREFIXES = [
  "/trip",
  "/trips",
  "/invite",
  "/forgot-password",
  "/reset-password",
  "/settings",
  "/profile",
  "/friends",
  "/inbox",
  "/lists",
  "/packing-lists",
  "/calendar",
  "/api",
] as const;

export function indexablePaths(): string[] {
  return [...STATIC_PUBLIC_PAGES.map((page) => page.path), ...AUTH_PATHS, ...EXPLORE_PAGES.map((page) => page.path)];
}

export function sitemapSections(): SitemapSection[] {
  return [
    { title: "Pages", links: STATIC_PUBLIC_PAGES.filter((page) => page.path !== SITEMAP_PATH) },
    { title: "Explore trips", links: EXPLORE_PAGES },
  ];
}

export function sitemapXml(base: string): string {
  const urls = indexablePaths().map((path) => `  <url><loc>${base}${path}</loc></url>`);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

export function robotsTxt(base: string): string {
  const disallow = PRIVATE_PREFIXES.map((prefix) => `Disallow: ${prefix}`);
  return ["User-agent: *", "Allow: /", ...disallow, "", `Sitemap: ${base}/sitemap.xml`, ""].join("\n");
}

type PublicPage = { path: string; title: string; description: string; card?: string };

const SITE_CARD = { url: "/opengraph-image", width: 1200, height: 630, alt: "Floc — Trip planning, sorted." };

export function publicMetadata({ path, title, description, card }: PublicPage): Metadata {
  const shared = title.includes("Floc") ? title : `${title} · Floc`;
  const image = card ? { ...SITE_CARD, url: card, alt: shared } : SITE_CARD;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: "Floc", title: shared, description, url: path, images: [image] },
    twitter: { card: "summary_large_image", title: shared, description, images: [image.url] },
    robots: { index: true, follow: true },
  };
}

export function authMetadata(page: PublicPage, redirect: string | undefined): Metadata {
  if (redirect === undefined) return publicMetadata(page);
  return { title: page.title, robots: { index: false, follow: false } };
}
