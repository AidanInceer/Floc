/**
 * /invite/[token] — pre-auth teaser (ticket 01 step 2, ticket 05, ticket 19).
 * Shows scale with trip progress; never reveals member emails, expense
 * amounts, or note bodies pre-auth — those need membership, not just the link.
 */
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getSession } from "@/server/access";
import { countIdeas } from "@/server/ideas";
import { listRouteDays } from "@/server/itinerary";
import {
  countMembers,
  findPendingInvite,
  findTripByInviteToken,
  isLiveMember,
} from "@/server/membership";
import { peopleByIds } from "@/server/friends";
import { formatDateRange } from "@/lib/dates";
import {
  Badge,
  ButtonLink,
  Card,
  CardHeader,
  Page,
  Stack,
} from "@/components/ui";
import { SubmitButton } from "@/components/client-ui";
import { joinTrip } from "./actions";

/**
 * The link names the trip (ticket 147). URL stays opaque — putting the name in
 * the path would leak it to every proxy/history the link passes through — so
 * the page carries it instead, in the tab title and link preview. A missing
 * trip gets the generic title; `notFound()` below is what answers a dead token.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const found = await findTripByInviteToken(token);
  if (!found) return { title: "Waypoint" };

  const title = `You've been invited to join “${found.name}”`;
  const description = found.hostName
    ? `${found.hostName} is planning ${found.name} on Waypoint.`
    : `${found.name} is being planned on Waypoint.`;

  return {
    title,
    description,
    openGraph: { title, description },
    robots: { index: false, follow: false }, // for the group, not a search index
  };
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const found = await findTripByInviteToken(token);
  if (!found) notFound();

  const session = await getSession();

  // Already a member: nothing left to offer them.
  if (session?.user && (await isLiveMember(found.id, session.user.id))) {
    redirect(`/trip/${found.id}/overview`);
  }

  // Three independent reads, was three serial round trips for one paragraph.
  const [memberCount, ideaCount, days] = await Promise.all([
    countMembers(found.id),
    countIdeas(found.id),
    listRouteDays(found.id),
  ]);

  // Consecutive days sharing an overnight place collapse into one "stop".
  const stops: string[] = [];
  for (const d of days) {
    const label = d.placeName ?? "Unset stop";
    if (stops[stops.length - 1] !== label) stops.push(label);
  }

  // Who's inviting (ticket 147): a named invite (ticket 146) has a real
  // inviter; anyone else holds a forwardable link, so naming a specific
  // sender would be a guess — the trip's starter is the most we can say.
  const namedInvite = session?.user
    ? await findPendingInvite(found.id, session.user.id)
    : undefined;
  const inviterName = namedInvite
    ? ((await peopleByIds([namedInvite.fromUserId])).get(namedInvite.fromUserId)
        ?.name ?? null)
    : null;

  const redirectTo = `/invite/${token}`;

  return (
    <Page>
      <div className="mx-auto max-w-lg pt-10">
        <Card>
          <CardHeader
            title={inviterName ? `${inviterName} invited you` : "You're invited"}
            hint="Waypoint — plan a trip with the group"
          />
          <Stack gap={4} className="p-5">
            <div>
              <h1 className="font-display text-2xl font-semibold">{found.name}</h1>
              <p className="mt-1 text-sm text-ink-soft">
                {found.hostName ? `Started by ${found.hostName} — ` : null}
                {memberCount} {memberCount === 1 ? "person" : "people"} already in
              </p>
            </div>

            {found.startDate || found.endDate ? (
              <p className="text-sm text-ink">
                {formatDateRange(found.startDate, found.endDate)}
              </p>
            ) : null}

            {ideaCount > 0 ? (
              <p className="text-sm text-ink">
                <Badge tone="open">{ideaCount} idea{ideaCount === 1 ? "" : "s"}</Badge>{" "}
                on the board so far
              </p>
            ) : null}

            {stops.length > 0 ? (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.06em] text-ink-soft">
                  Route so far
                </p>
                <p className="text-sm text-ink">{stops.join(" → ")}</p>
              </div>
            ) : null}

            {!session?.user ? (
              <ButtonLink
                variant="primary"
                href={`/signup?redirect=${encodeURIComponent(redirectTo)}&via=link`}
              >
                Join this trip
              </ButtonLink>
            ) : (
              <form action={joinTrip.bind(null, token)}>
                <SubmitButton pendingLabel="Joining…">Join this trip</SubmitButton>
              </form>
            )}
          </Stack>
        </Card>
      </div>
    </Page>
  );
}
