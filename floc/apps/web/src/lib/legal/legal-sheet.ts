import { LEGAL_LINKS } from "./legal-links";

export function legalLinkFor(pathname: string) {
  return LEGAL_LINKS.find((link) => link.href === pathname) ?? null;
}

export function riseFrom({ barTop, sheetTop, viewport }: { barTop: number | null; sheetTop: number; viewport: number }) {
  const start = barTop === null || barTop > viewport ? viewport : barTop;
  return Math.max(0, start - sheetTop);
}
