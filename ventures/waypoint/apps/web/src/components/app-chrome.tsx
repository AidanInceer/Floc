/**
 * The account-level chrome (ticket 191): wordmark left, one pill-navigation
 * group in the middle, account controls right — the same shape on every screen
 * and at every size. Trip tabs are the same pill group, rendered by the trip
 * layout; this bar holds the signed-in surfaces when you're outside a trip.
 */
import Link from "next/link";

import { ButtonLink } from "@/components/ui";
import { PillNav, type PillNavItem } from "@/components/pill-nav";
import { AccountMenu } from "@/components/account-menu";
import { ThemeSwitch } from "@/components/theme-switch";

// The typographic wordmark: the display face, lowercase, with the one blue dot
// that carries through the product as "yours". Replaces the paper-era serif
// logo — it can't sit on the white ground.
function WaypointWordmark() {
  return (
    <span className="font-display text-[15px] font-semibold leading-none tracking-tight text-ink sm:text-[22px]">
      way<span className="text-pen">.</span>point
    </span>
  );
}

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
  isPro = false,
}: {
  user: { id: string; name: string; image: string | null } | null;
  /** Badges the bar in gold, so Pro is visible from every screen. */
  isPro?: boolean;
  /** Open trip invites for this account — badges the Trips link. */
  inviteCount?: number;
  /** Friend requests waiting on this account — badges the Friends link. */
  friendRequestCount?: number;
}) {
  // Your signed-in surfaces, in one pill group. Discover sits among them —
  // browsing is still one of the places you go.
  const navItems: PillNavItem[] = [
    {
      href: "/trips",
      label: "Trips",
      badge: inviteCount ? (
        <WaitingCount
          count={inviteCount}
          label={`trip ${inviteCount === 1 ? "invitation" : "invitations"}`}
        />
      ) : undefined,
    },
    { href: "/explore", label: "Explore" },
    {
      href: "/friends",
      label: "Friends",
      badge: friendRequestCount ? (
        <WaitingCount
          count={friendRequestCount}
          label={`friend ${friendRequestCount === 1 ? "request" : "requests"}`}
        />
      ) : undefined,
    },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-rule bg-sheet/90 backdrop-blur">
      {/* Three columns so the nav is centred and the account stays hard right
          whether or not the middle is filled. */}
      {/* Flex, not a three-column grid: an `auto` grid track refuses to shrink
          below its max-content, so at phone widths the pills grew past their
          column and sat over the wordmark. Here the ends are content-sized and
          unshrinkable, and the middle takes what is left — the track scrolls
          inside it rather than pushing anything off the row. */}
      <div className="mx-auto flex h-14 w-full max-w-[84rem] items-center gap-1.5 px-2 sm:gap-4 sm:px-6">
        <Link
          href="/"
          aria-label="Waypoint home"
          className="flex shrink-0 items-center transition-opacity hover:opacity-70"
        >
          <WaypointWordmark />
        </Link>

        <div className="flex min-w-0 flex-1 justify-center">
          {user ? <PillNav label="Your surfaces" items={navItems} /> : null}
        </div>

        {/* The theme switch sits with the account controls, signed in or out —
            the same control in the same place either way (ticket 240). */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Gold, and the only gold in the bar — it reads as the one paid
              thing rather than as another control. Links to the billing
              panel, because "what am I on" and "change it" are one question. */}
          {user && isPro ? (
            <Link
              href="/settings?section=billing"
              className="hidden items-center gap-1 rounded-full border border-pro-gold px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-pro-gold hover:bg-pro-gold/10 sm:inline-flex"
              title="You're on Waypoint Pro"
            >
              Pro
            </Link>
          ) : null}
          <ThemeSwitch />
          {user ? (
            <AccountMenu user={user} />
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost">
                Log in
              </ButtonLink>
              <ButtonLink href="/signup" variant="primary">
                Sign up
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
