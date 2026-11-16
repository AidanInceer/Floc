import Link from "next/link";

import { ButtonLink, cx } from "@/components/system/ui";
import { BEAD, BEAD_COUNT, BEAD_ITEMS } from "@/components/chrome/bead";
import { PlacesNav, type PlaceItem } from "@/components/chrome/places-nav";
import { AccountBell } from "@/components/chrome/account/account-bell";
import { AccountCard } from "@/components/chrome/account/account-card";
import type { InboxPreviewItem } from "@/components/chrome/account/account-inbox";
import { FuseBar } from "@/components/chrome/fuse-bar";
import { FlocWordmark } from "@/components/system/wordmark";

function WaitingCount({ count, label }: { count: number; label: string }) {
  return (
    <span className={BEAD_COUNT} aria-label={`${count} ${label} waiting`}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function AppChrome({
  user,
  inviteCount = 0,
  notificationCount = 0,
  latest = [],
}: {
  user: { id: string; name: string; email: string } | null;
  inviteCount?: number;
  notificationCount?: number;
  latest?: InboxPreviewItem[];
}) {
  const navItems: PlaceItem[] = [
    { href: "/explore", label: "Explore", glyph: "explore" },
    {
      href: "/trips",
      label: "Trips",
      glyph: "trips",
      badge: inviteCount ? (
        <WaitingCount
          count={inviteCount}
          label={`trip ${inviteCount === 1 ? "invitation" : "invitations"}`}
        />
      ) : undefined,
    },
  ];

  return (
    <header className="pointer-events-none sticky top-0 z-20 flex justify-center px-2 pb-1 pt-3 sm:px-4">
      <FuseBar className="pointer-events-auto flex min-w-0 max-w-full items-center gap-1.5">
        <Link
          href="/"
          aria-label="Floc home"
          className={cx(BEAD, "shrink-0 px-3 transition-opacity hover:opacity-80")}
        >
          <FlocWordmark />
        </Link>

        <PlacesNav
          label={user ? "Your places" : "Browse"}
          items={user ? navItems : navItems.filter((i) => i.href === "/explore")}
        />

        {user ? (
          <div className={cx(BEAD, BEAD_ITEMS, "relative shrink-0")}>
            <AccountBell unread={notificationCount} latest={latest} />
            <AccountCard name={user.name} email={user.email} />
          </div>
        ) : (
          <div className={cx(BEAD, "shrink-0 gap-1")}>
            <ButtonLink href="/login" variant="ghost">
              Sign in
            </ButtonLink>
            <ButtonLink href="/signup" variant="primary">
              Sign up
            </ButtonLink>
          </div>
        )}
      </FuseBar>
    </header>
  );
}
