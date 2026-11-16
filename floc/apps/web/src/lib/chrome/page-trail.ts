import { legalLinkFor } from "@/lib/legal/legal-sheet";

let last: string | null = null;

export function notePage(pathname: string): void {
  if (!legalLinkFor(pathname)) last = pathname;
}

export const lastPage = (fallback: string): string => last ?? fallback;
