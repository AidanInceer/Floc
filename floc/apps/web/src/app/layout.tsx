import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  DM_Mono,
  Instrument_Sans,
} from "next/font/google";

import { AppChrome } from "@/components/app-chrome";
import { THEME_BOOTSTRAP } from "@/lib/theme";
import { getSession } from "@/server/access";
import { countIncomingFriendRequests } from "@/server/friends";
import { countPendingInvitesFor } from "@/server/invites";
import { getProfile } from "@/server/profile";

import "./globals.css";

// The three faces of the white-and-pastel direction (ticket 189): a characterful
// display face for headings and figures, a plain body face for running text and
// controls, and a mono for dates, times, amounts and small uppercase labels.
// Self-hosted through next/font — no flash of the wrong face. The handwriting
// face is retired; it belonged to the notebook look.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display-face",
  weight: ["500", "600", "700"],
});

const body = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body-face",
});

const mono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-data-face",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Floc — plan a trip with the group",
  description:
    "Floc keeps a group trip in one place: ideas, the route, the days, and who owes who.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // The badges on Trips (ticket 146) and Friends (ticket 145): an invite and a
  // friend request are the two things that arrive while you're elsewhere in the
  // app, so both have to be visible from anywhere. Counts, not the things
  // themselves — the answering happens on the page behind each link.
  const [inviteCount, friendRequestCount, profile] = session?.user
    ? await Promise.all([
        countPendingInvitesFor(session.user.id),
        countIncomingFriendRequests(session.user.id),
        getProfile(session.user.id),
      ])
    : [0, 0, undefined];

  // The header must key the avatar off the same identity a roster does
  // (`displayName ?? name`), so the viewer is the same initials and colour
  // everywhere (whoTone).
  const chromeUser = session?.user
    ? {
        id: session.user.id,
        name: profile?.displayName ?? session.user.name,
        image: profile?.avatarUrl ?? session.user.image ?? null,
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
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="min-h-dvh">
        <AppChrome
          user={chromeUser}
          inviteCount={inviteCount}
          friendRequestCount={friendRequestCount}
        />
        <main>{children}</main>
      </body>
    </html>
  );
}
