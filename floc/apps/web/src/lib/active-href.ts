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
