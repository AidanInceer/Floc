/**
 * The files tab, for somebody on a share link (#330). Names and filing, greyed,
 * every click dead — so that the trip reads as a real one without a byte
 * leaving it.
 *
 * No `GuestGate` here: the ask ran on the page the link lands on, and a dialog
 * on every tab would be a wall. The bar in the layout carries it.
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { GuestDocuments } from "@/components/guest/guest-documents";
import { emailConfigured } from "@/server/auth/email";
import { guestDocuments } from "@/server/trips/guest-view";
import { PageTitle } from "@/components/system/ui";
import { DeadLink } from "@/components/guest/dead-link";
import { inviteTrip, inviteViewer } from "../invite-access";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const trip = await inviteTrip(token);
  const robots = { index: false, follow: false };

  if (!trip) return { title: { absolute: "Floc" }, robots };
  return { title: `${trip.name} — files`, robots };
}

export default async function InviteFilesPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const trip = await inviteTrip(token);
  if (!trip) return <DeadLink />;

  const viewer = await inviteViewer(trip.id, emailConfigured());
  // A member has the real Files tab, where everything opens.
  if (viewer.kind === "member") redirect(`/trip/${trip.id}/files`);

  const docs = await guestDocuments(trip.id);

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <PageTitle>{trip.name}</PageTitle>
      <div className="mt-6">
        <GuestDocuments docs={docs} />
      </div>
    </div>
  );
}
