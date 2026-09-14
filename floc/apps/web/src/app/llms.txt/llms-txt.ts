import { LEGAL_LINKS } from "@/components/chrome/legal-links";

import { tourFor } from "../landing-content";

const PAGES = [
  { href: "/", label: "Home", about: "what Floc does, walked through one trip" },
  { href: "/explore", label: "Explore", about: "ready-made trip ideas to start from" },
  { href: "/signup", label: "Sign up", about: "make an account to plan a trip" },
];

export function llmsTxt(origin: string): string {
  const link = (href: string, label: string) => `[${label}](${origin}${href})`;
  return [
    "# Floc",
    "",
    "> Group-travel planner. A group decides where and when to go, plans the days, packs, and sees who owes who.",
    "",
    "Trips are private to their members. Signed-in pages are not listed here and need an account.",
    "",
    "## Pages",
    "",
    ...PAGES.map((p) => `- ${link(p.href, p.label)}: ${p.about}`),
    "",
    "## Features",
    "",
    ...tourFor(false).map((s) => `- ${s.title}: ${s.detail}`),
    "",
    "## Optional",
    "",
    ...LEGAL_LINKS.map((l) => `- ${link(l.href, l.label)}`),
    "",
  ].join("\n");
}
