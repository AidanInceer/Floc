/**
 * What somebody holding a trip's share link sees (#330; replaces the teaser of
 * ticket 01 step 2, ticket 05, ticket 19, redesigned 199).
 *
 * WHAT CHANGED, AND WHY. This used to be a summary card — when, where, and a
 * blurred panel saying "join to see". It showed the trip without showing the
 * trip. Now the real itinerary is here, read-only, behind the ask: somebody
 * deciding whether to join should be able to see what they would be joining.
 *
 * NOT HERE, and not by omission — by rule. No roster, no money, no notes, no
 * member email, and no file bytes. Those belong to the people in the trip, and
 * a share link is forwardable, so everyone it reaches would otherwise get them
 * for free. The reads are the projections in `server/trips/guest-view.ts`,
 * which have no field to leak.
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { GuestGate } from "@/components/guest/guest-gate";
import { GuestItinerary } from "@/components/guest/guest-itinerary";
import { emailConfigured } from "@/server/auth/email";
import { guestItinerary } from "@/server/trips/guest-view";
import { formatDateRange } from "@floc/core/dates/dates";
import { PageTitle } from "@/components/system/ui";
import { DeadLink } from "@/components/guest/dead-link";
import { JoinControls } from "@/components/guest/join-controls";
import { inviteTrip, inviteViewer } from "./invite-access";

/**
 * The link names the trip (ticket 147). The URL stays opaque — putting the name
 * in the path would leak it to every proxy and history the link passes through
 * — so the page carries it instead, in the tab title and link preview.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const found = await inviteTrip(token);
  if (!found) return { title: "Floc" };

  const title = `You've been invited to join “${found.name}”`;
  const description = found.hostName
    ? `${found.hostName} is planning ${found.name} on Floc.`
    : `${found.name} is being planned on Floc.`;

  return {
    title,
    description,
    openGraph: { title, description },
    robots: { index: false, follow: false }, // for the group, not a search index
  };
}

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ verify?: string }>;
}) {
  const { token } = await params;
  const { verify } = await searchParams;

  const trip = await inviteTrip(token);
  if (!trip) return <DeadLink />;

  const viewer = await inviteViewer(trip.id, emailConfigured());
  // Already in: nothing here is worth showing them a read-only copy of.
  if (viewer.kind === "member") redirect(`/trip/${trip.id}/overview`);

  const days = await guestItinerary(trip.id);
  const dated = trip.startDate || trip.endDate;

  return (
    <GuestGate
      tripName={trip.name}
      hostName={trip.hostName}
      controls={
        <JoinControls token={token} viewer={viewer} verifyState={verify} />
      }
    >
      <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
        <PageTitle>{trip.name}</PageTitle>
        <p className="mt-2 text-md text-ink-soft">
          {dated
            ? formatDateRange(trip.startDate, trip.endDate)
            : "The dates are not settled yet."}
        </p>

        <div className="mt-6">
          <GuestItinerary days={days} />
        </div>
      </div>
    </GuestGate>
  );
}
