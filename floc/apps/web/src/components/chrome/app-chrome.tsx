/**
 * The top bar: three beads, centred — the wordmark, your places, you. The same
 * shape on every screen and at every size. The current place's glyph takes the
 * blue tile the trip tabs use below it, so the two bars say "here" one way.
 */

import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import Link from "next/link";

import { ButtonLink, cx } from "@/components/system/ui";
import { BEAD } from "@/components/chrome/bead";
import { PlacesNav, type PlaceItem } from "@/components/chrome/places-nav";
import { AccountMenu } from "@/components/chrome/account/account-menu";
import type { InboxPreviewItem } from "@/components/chrome/account/account-inbox";
import { FlocWordmark } from "@/components/system/wordmark";

/**
 * How much is waiting behind a link — trip invites (ticket 146) and friend
 * requests (ticket 145). A count and not a dot: "2" says how much is behind the
 * link, which a dot never does, and the number is what the screen reader reads.
 */
function WaitingCount({ count, label }: { count: number; label: string }) {
  return (
    <span
      className="ml-1.5 inline-flex min-w-[17px] items-center justify-center rounded-full bg-pen px-1 text-[10.5px] font-semibold leading-[17px] text-sheet"
      aria-label={`${count} ${label} waiting`}
    >
      {count}
    </span>
  );
}

export function AppChrome({
  user,
  inviteCount = 0,
  friendRequestCount = 0,
  notificationCount = 0,
  latest = [],
  tripCount = 0,
  friendCount = 0,
  isPro = false,
}: {
  user: { id: string; name: string; email: string; avatarIcon: AvatarIcon | null } | null;
  isPro?: boolean;
  /** Open trip invites for this account — badges the Trips link. */
  inviteCount?: number;
  /** Friend requests waiting on this account — badges the Friends link. */
  friendRequestCount?: number;
  /** Unseen notifications (#344) — badges the avatar. */
  notificationCount?: number;
  latest?: InboxPreviewItem[];
  tripCount?: number;
  friendCount?: number;
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
    {
      href: "/friends",
      label: "Friends",
      glyph: "friends",
      badge: friendRequestCount ? (
        <WaitingCount
          count={friendRequestCount}
          label={`friend ${friendRequestCount === 1 ? "request" : "requests"}`}
        />
      ) : undefined,
    },
  ];

  return (
    // The bar itself is see-through and lets clicks pass; only the beads catch them.
    <header className="pointer-events-none sticky top-0 z-20 flex justify-center px-2 pb-1 pt-3 sm:px-4">
      <div className="pointer-events-auto flex min-w-0 max-w-full items-center gap-1.5">
        <Link
          href="/"
          aria-label="Floc home"
          className={cx(BEAD, "shrink-0 px-3 transition-opacity hover:opacity-80")}
        >
          <FlocWordmark />
        </Link>

        {/* Explore is public, so it stays in the bar signed out — the one
            surface a visitor can reach without an account. */}
        <PlacesNav
          label={user ? "Your places" : "Browse"}
          items={user ? navItems : navItems.filter((i) => i.href === "/explore")}
        />

        {user ? (
          <AccountMenu
            user={user}
            isPro={isPro}
            unread={notificationCount}
            latest={latest}
            tripCount={tripCount}
            friendCount={friendCount}
          />
        ) : (
          <div className={cx(BEAD, "shrink-0 gap-1")}>
            <ButtonLink href="/login" variant="ghost">
              Log in
            </ButtonLink>
            <ButtonLink href="/signup" variant="primary">
              Sign up
            </ButtonLink>
          </div>
        )}
      </div>
    </header>
  );
}
