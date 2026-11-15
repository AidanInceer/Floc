/** `short` is the word a phone shows, so the six links fit one line at 360px. */
export const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy policy", short: "Privacy" },
  { href: "/cookies", label: "Cookie policy", short: "Cookies" },
  { href: "/terms", label: "Terms of use", short: "Terms" },
  { href: "/legal", label: "Legal notice", short: "Legal" },
  { href: "/contact", label: "Contact", short: "Contact" },
  { href: "/sitemap", label: "Sitemap", short: "Sitemap" },
] as const;

export type LegalHref = (typeof LEGAL_LINKS)[number]["href"];
