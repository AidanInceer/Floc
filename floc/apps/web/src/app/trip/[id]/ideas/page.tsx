/** The tab was renamed Ideas → Notes (ticket 238); old links and mail still point here. */
import { redirect } from "next/navigation";

export default async function IdeasRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/trip/${id}/notes`);
}
