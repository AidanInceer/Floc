/**
 * A trip link (#408): a chip in a notes page that points at one thing on the
 * trip. The page stores the kind, the id and the last name it saw; the name
 * shown is always the thing's current one.
 */

// Order is menu order.
export const LINK_KINDS = ["day", "event", "place", "expense", "packing", "file"] as const;
export type LinkKind = (typeof LINK_KINDS)[number];

export const LINK_GROUPS: Record<LinkKind, string> = {
  day: "Days",
  event: "Events",
  place: "Places",
  expense: "Money",
  packing: "Packing",
  file: "Files",
};

/** The trip tab a link opens. */
export const LINK_TABS: Record<LinkKind, "days" | "overview" | "money" | "packing" | "files"> = {
  day: "days",
  event: "days",
  place: "overview",
  expense: "money",
  packing: "packing",
  file: "files",
};

export type TripLinkItem = { kind: LinkKind; id: number; label: string; detail: string };

export function isLinkKind(value: unknown): value is LinkKind {
  return typeof value === "string" && (LINK_KINDS as readonly string[]).includes(value);
}

/** The menu's list: grouped in kind order, filtered on the name, the group and the detail. */
export function findLinks(items: readonly TripLinkItem[], query: string): TripLinkItem[] {
  const q = query.trim().toLowerCase();
  const matches = (item: TripLinkItem) =>
    !q || `${item.label} ${LINK_GROUPS[item.kind]} ${item.kind} ${item.detail}`.toLowerCase().includes(q);
  return LINK_KINDS.flatMap((kind) => items.filter((item) => item.kind === kind && matches(item)));
}

export type ShownLink = { label: string; removed: boolean };

/** What a chip reads: the thing's name now, or the last name seen and "Removed" once it has gone. */
export function showLink(link: { kind: LinkKind; id: number; label: string }, items: readonly TripLinkItem[]): ShownLink {
  const now = items.find((item) => item.kind === link.kind && item.id === link.id);
  return now ? { label: now.label, removed: false } : { label: link.label, removed: true };
}
