import { LEGAL_LINKS } from "./legal-links";

export function legalLinkFor(pathname: string) {
  return LEGAL_LINKS.find((link) => link.href === pathname) ?? null;
}

/** How far below its resting place the sheet starts, so its link bar begins exactly over the footer's. */
export function riseFrom({ barTop, sheetTop, viewport }: { barTop: number | null; sheetTop: number; viewport: number }) {
  const start = barTop === null || barTop > viewport ? viewport : barTop;
  return Math.max(0, start - sheetTop);
}
