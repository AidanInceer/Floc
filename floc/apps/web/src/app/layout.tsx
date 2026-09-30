// Why: first, so Tailwind names its layer order before a component's stylesheet can declare `components` below `base`.
import "./globals.css";
import "./fonts/extended.css";

import type { Metadata } from "next";
import localFont from "next/font/local";

import { AppChrome } from "@/components/chrome/app-chrome";
import { SiteFooter } from "@/components/chrome/site-footer";
import { themeBootstrap } from "@/lib/theme";
import { getSession } from "@/server/access";
import { subscriptionOf } from "@/server/billing/billing";
import { allFeaturesFree } from "@/lib/env";
import { isLive } from "@floc/core/billing/subscription-copy";
import { countFriendsFor, countIncomingFriendRequests } from "@/server/social/friends";
import { countPendingInvitesFor } from "@/server/trips/invites";
import { countTripsFor } from "@/server/trips/trips";
import { countUnread, listUnseen } from "@/server/notifications/inbox";
import { getProfile } from "@/server/auth/profile";

const ACCOUNT_MENU_PREVIEW = 3;

// The three faces of the white-and-pastel direction (ticket 189): a characterful
// display face for headings and figures, a plain body face for running text and
// controls, and a mono for dates, times, amounts and small uppercase labels.
// Why: bundled WOFF2 files keep dev and builds independent of Google Fonts downloads.
const display = localFont({
  src: "./fonts/bricolage-grotesque-latin.woff2",
  variable: "--font-display-face",
  weight: "500 700",
  style: "normal",
  adjustFontFallback: false,
});

const body = localFont({
  src: "./fonts/instrument-sans-latin.woff2",
  variable: "--font-body-face",
  weight: "400 700",
  style: "normal",
  adjustFontFallback: false,
});

const mono = localFont({
  src: [
    { path: "./fonts/dm-mono-regular-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/dm-mono-medium-latin.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-data-face",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: { default: "Floc — plan a trip with the group", template: "%s · Floc" },
  description:
    "Floc keeps a group trip in one place: the notes, the route, the days, and who owes who.",
};

export default async function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const session = await getSession();

  // The badges on Trips (ticket 146) and Friends (ticket 145): an invite and a
  // friend request are the two things that arrive while you're elsewhere in the
  // app, so both have to be visible from anywhere. Counts, not the things
  // themselves — the answering happens on the page behind each link.
  const [inviteCount, friendRequestCount, profile, proRow, notificationCount, latest, tripCount, friendCount] =
    session?.user
      ? await Promise.all([
          countPendingInvitesFor(session.user.id),
          countIncomingFriendRequests(session.user.id),
          getProfile(session.user.id),
          subscriptionOf(session.user.id),
          countUnread(session.user.id),
          listUnseen(session.user.id, ACCOUNT_MENU_PREVIEW),
          countTripsFor(session.user.id),
          countFriendsFor(session.user.id),
        ])
      : [0, 0, undefined, null, 0, [], 0, 0];

  // The header must key the avatar off the same identity a roster does
  // (`displayName ?? name`), so the viewer is the same initials and colour
  // everywhere (whoTone).
  const chromeUser = session?.user
    ? {
        id: session.user.id,
        name: profile?.displayName ?? session.user.name,
        email: session.user.email,
        avatarIcon: profile?.avatarIcon ?? null,
      }
    : null;

  // `data-theme` is written by the bootstrap script below, before paint and
  // therefore after this markup is serialised — hence suppressHydrationWarning
  // on the one element it touches (ticket 240).
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap(Boolean(session?.user)) }} />
      </head>
      <body className="min-h-dvh">
        <AppChrome
          user={chromeUser}
          inviteCount={inviteCount}
          friendRequestCount={friendRequestCount}
          notificationCount={notificationCount}
          latest={latest}
          tripCount={tripCount}
          friendCount={friendCount}
          isPro={!allFeaturesFree() && proRow !== null && isLive(proRow)}
        />
        <main>{children}</main>
        <SiteFooter />
        {modal}
      </body>
    </html>
  );
}
