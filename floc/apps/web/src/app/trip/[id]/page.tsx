/**
 * `/trip/[id]` has no page of its own — Overview is the default tab and the
 * trip's landing (ticket 05).
 */
import { redirect } from "next/navigation";

export default async function TripRootPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/trip/${id}/overview`);
}
