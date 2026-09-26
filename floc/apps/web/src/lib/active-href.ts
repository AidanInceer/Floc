// Why: `under` lends a link the pages outside its path — a trip is at `/trip/12`, but it is one of your Trips.
export function activeHref(
  pathname: string,
  hrefs: string[],
  under: Record<string, string> = {},
): string | null {
  const own = hrefs.find((href) => pathname === href || pathname.startsWith(`${href}/`));
  if (own) return own;
  const lent = Object.entries(under).find(([prefix]) => pathname.startsWith(prefix));
  return lent && hrefs.includes(lent[1]) ? lent[1] : null;
}
