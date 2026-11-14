export type AccountTabKey = "profile" | "friends" | "groups" | "wish" | "saved" | "packing" | "bookings";

export type AccountTab = { key: AccountTabKey; href: string; label: string };

/** Why: every account page sits on one level, so nothing hides in a segment inside a tab (#637). You, your people, what you keep, your bookings. Settings live on Profile. */
export const ACCOUNT_CLUSTERS: readonly (readonly AccountTab[])[] = [
  [{ key: "profile", href: "/profile", label: "Profile" }],
  [
    { key: "friends", href: "/friends", label: "Friends" },
    { key: "groups", href: "/friends/groups", label: "Groups" },
  ],
  [
    { key: "saved", href: "/lists", label: "Saved" },
    { key: "wish", href: "/lists/wish", label: "Wish lists" },
    { key: "packing", href: "/lists/packing", label: "Packing" },
  ],
  [{ key: "bookings", href: "/bookings", label: "Bookings" }],
];

/** The card behind your face opens the first page of each cluster after Profile; the lists cluster goes by its name, Lists. */
export const CARD_SHORTCUTS: readonly AccountTab[] = ACCOUNT_CLUSTERS.slice(1).map(([first]) =>
  first.key === "saved" ? { ...first, label: "Lists" } : first,
);

export function accountTabCounts({ friendRequestCount, bookingCount }: { friendRequestCount: number; bookingCount: number }) {
  const counts: Partial<Record<AccountTabKey, number>> = {};
  if (friendRequestCount > 0) counts.friends = friendRequestCount;
  if (bookingCount > 0) counts.bookings = bookingCount;
  return counts;
}
