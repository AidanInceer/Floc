import { legalLinkFor } from "@/lib/legal/legal-sheet";

/**
 * Why (#271): the legal pages rise over the page a person was on, so feedback sent from Contact names that page,
 * not `/contact`. Held in memory for the open tab only.
 */
let last: string | null = null;

export function notePage(pathname: string): void {
  if (!legalLinkFor(pathname)) last = pathname;
}

export const lastPage = (fallback: string): string => last ?? fallback;
