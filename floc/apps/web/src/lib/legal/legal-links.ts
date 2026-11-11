/** `short` is the word a phone shows, so the six links fit one line at 360px. */
export const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy policy", short: "Privacy" },
  { href: "/cookies", label: "Cookies", short: "Cookies" },
  { href: "/terms", label: "Terms of use", short: "Terms" },
  { href: "/legal", label: "Legal", short: "Legal" },
  { href: "/contact", label: "Contact", short: "Contact" },
  { href: "/sitemap", label: "Sitemap", short: "Sitemap" },
] as const;

export type LegalHref = (typeof LEGAL_LINKS)[number]["href"];
