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

export function findLinks(items: readonly TripLinkItem[], query: string): TripLinkItem[] {
  const q = query.trim().toLowerCase();
  const matches = (item: TripLinkItem) =>
    !q || `${item.label} ${LINK_GROUPS[item.kind]} ${item.kind} ${item.detail}`.toLowerCase().includes(q);
  return LINK_KINDS.flatMap((kind) => items.filter((item) => item.kind === kind && matches(item)));
}

export type ShownLink = { label: string; removed: boolean };

export function showLink(link: { kind: LinkKind; id: number; label: string }, items: readonly TripLinkItem[]): ShownLink {
  const now = items.find((item) => item.kind === link.kind && item.id === link.id);
  return now ? { label: now.label, removed: false } : { label: link.label, removed: true };
}
