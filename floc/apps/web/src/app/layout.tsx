import "./globals.css";
import "./fonts/extended.css";

import type { Metadata } from "next";
import localFont from "next/font/local";
import { headers } from "next/headers";

import { AppChrome } from "@/components/chrome/app-chrome";
import { WhichTripPrompt } from "@/components/bookings/which-trip-prompt";
import { ClientErrorReporter } from "@/components/chrome/client-error-reporter";
import { PageTrail } from "@/components/chrome/page-trail";
import { ConsentBanner } from "@/components/chrome/consent/consent-banner";
import { PageViewBeacon } from "@/components/chrome/consent/page-view-beacon";
import { requestConsent } from "@/server/consent/consent";
import { SiteFooter } from "@/components/chrome/site-footer";
import { SessionRenewal } from "@/components/chrome/session-renewal";
import { ThemeKeeper } from "@/components/chrome/theme-keeper";
import { NONCE_HEADER } from "@/lib/http/csp";
import { themeBootstrap } from "@/lib/theme";
import { getSession } from "@/server/access";
import { appUrl } from "@/lib/env";
import { topBarFor, TOP_BAR_PREVIEW } from "@/server/chrome/top-bar";

const SIGNED_OUT: Awaited<ReturnType<typeof topBarFor>> = {
  inviteCount: 0,
  friendRequestCount: 0,
  profile: undefined,
  notificationCount: 0,
  latest: [],
  bookings: { files: [], trips: [] },
};

const display = localFont({
  src: "../../public/fonts/red-hat-display-latin.woff2",
  variable: "--font-display-face",
  weight: "800",
  style: "normal",
  adjustFontFallback: false,
});

const body = localFont({
  src: "../../public/fonts/red-hat-text-latin.woff2",
  variable: "--font-body-face",
  weight: "300 700",
  style: "normal",
  adjustFontFallback: false,
});

const mono = localFont({
  src: "../../public/fonts/red-hat-mono-latin.woff2",
  variable: "--font-data-face",
  weight: "300 700",
  style: "normal",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  robots: { index: false, follow: false },
  title: { default: "Floc — Trip planning, sorted.", template: "%s · Floc" },
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
  const [session, nonce, consent] = await Promise.all([getSession(), headers().then((h) => h.get(NONCE_HEADER) ?? undefined), requestConsent()]);

  const { inviteCount, profile, notificationCount, latest, bookings } =
    session?.user ? await topBarFor(session.user.id, TOP_BAR_PREVIEW) : SIGNED_OUT;

  const chromeUser = session?.user
    ? {
        id: session.user.id,
        name: profile?.displayName ?? session.user.name,
        email: session.user.email,
      }
    : null;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <head>
        <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeBootstrap(Boolean(session?.user)) }} />
      </head>
      <body className="min-h-dvh">
        <ThemeKeeper signedIn={Boolean(session?.user)} />
        <AppChrome
          user={chromeUser}
          inviteCount={inviteCount}
          notificationCount={notificationCount}
          latest={latest}
        />
        <main>{children}</main>
        {bookings.files.length > 0 ? <WhichTripPrompt files={bookings.files} trips={bookings.trips} /> : null}
        <SiteFooter />
        {modal}
        {session?.user ? <SessionRenewal /> : null}
        <ClientErrorReporter />
        <PageTrail />
        <PageViewBeacon />
        <ConsentBanner fromServer={consent} />
      </body>
    </html>
  );
}
