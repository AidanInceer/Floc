/**
 * /invite/[token] — pre-auth teaser (ticket 01 step 2, ticket 05, ticket 19;
 * redesigned 199). The trip first, the sign-up second: someone should be able
 * to decide whether they're interested before being asked for anything.
 *
 * What stays behind the join action is anything that belongs to the people
 * already in — their names and faces, what has been spent, what's been said.
 * The link is forwardable, so everyone it reaches would otherwise get that for
 * free. It's drawn as "join to see", not as a wall.
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/server/access";
import { listRouteDays } from "@/server/itinerary/itinerary";
import { findPendingInvite, findTripByInviteToken } from "@/server/trips/invites";
import { countMembers, isLiveMember } from "@/server/trips/roster";
import { emailConfigured } from "@/server/auth/email";
import { peopleByIds } from "@/server/social/friends";
import { formatDateRange } from "@floc/core/dates/dates";
import { ButtonLink, PageTitle } from "@/components/system/ui";
import { SubmitButton } from "@/components/system/client-ui";
import { joinTrip, resendVerification } from "./actions";

/**
 * The link names the trip (ticket 147). URL stays opaque — putting the name in
 * the path would leak it to every proxy/history the link passes through — so
 * the page carries it instead, in the tab title and link preview.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const found = await findTripByInviteToken(token);
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

  const found = await findTripByInviteToken(token);
  // A dead token gets its own answer rather than the generic not-found: the
  // token is a random UUID, so saying "this link no longer works" reveals
  // nothing an attacker could enumerate, and a stranger holding a stale link
  // deserves to know which of the two problems they have.
  if (!found) return <DeadLink />;

  const session = await getSession();

  // Already a member: nothing left to offer them.
  if (session?.user && (await isLiveMember(found.id, session.user.id))) {
    redirect(`/trip/${found.id}/overview`);
  }

  // Two independent reads, was two serial round trips for one paragraph.
  const [memberCount, days] = await Promise.all([
    countMembers(found.id),
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
  const dated = found.startDate || found.endDate;

  // The same action twice — once at the top for anyone already sold, once at
  // the foot for anyone who read the whole thing.
  const join = !session?.user ? (
    <div className="flex flex-wrap items-center gap-3">
      <ButtonLink
        variant="primary"
        href={`/signup?redirect=${encodeURIComponent(redirectTo)}&via=link`}
      >
        Join this trip
      </ButtonLink>
      <ButtonLink
        variant="secondary"
        href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
      >
        I have an account
      </ButtonLink>
    </div>
  ) : !session.user.emailVerified && emailConfigured() ? (
    // The friendly face of the gate `joinTrip` enforces (#149).
    <div className="flex flex-col items-start gap-2">
      <p className="text-sm text-ink-soft">
        {verify === "sent"
          ? `We've sent a confirmation link to ${session.user.email}. Open it, then come back to join.`
          : `Confirm your email first — we sent a link to ${session.user.email} when you signed up.`}
      </p>
      <form action={resendVerification.bind(null, token)}>
        <SubmitButton variant="secondary" pendingLabel="Sending…">
          Resend confirmation
        </SubmitButton>
      </form>
    </div>
  ) : (
    <form action={joinTrip.bind(null, token)}>
      <SubmitButton pendingLabel="Joining…">Join this trip</SubmitButton>
    </form>
  );

  return (
    <div className="mx-auto w-full max-w-[62rem] px-4 pb-20 pt-10 sm:px-6">
      <header>
        <p className="typed">
          {inviterName
            ? `${inviterName} invited you`
            : found.hostName
              ? `${found.hostName} is planning this`
              : "You're invited"}
        </p>
        <h1 className="mt-3 text-[clamp(2.1rem,5vw,3.4rem)]">{found.name}</h1>
        <p className="mt-3 max-w-[60ch] text-md text-ink-soft">
          {memberCount} {memberCount === 1 ? "person is" : "people are"} already
          planning this on Floc. Have a look before you decide.
        </p>
        <div className="mt-6">{join}</div>
      </header>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg bg-peri p-6 text-peri-ink">
          <p className="typed text-current">When</p>
          <p className="mt-3 text-2xl font-semibold">
            {dated ? formatDateRange(found.startDate, found.endDate) : "Not settled yet"}
          </p>
          <p className="mt-2 text-sm opacity-75">
            {dated
              ? "The window the group has agreed on."
              : "The group is still working out which days everyone can do."}
          </p>
        </section>

        <section className="rounded-lg bg-blush p-6 text-blush-ink">
          <p className="typed text-current">Where</p>
          {stops.length > 0 ? (
            <>
              <p className="mt-3 text-2xl font-semibold">{stops.join(" → ")}</p>
              <p className="mt-2 text-sm opacity-75">
                {days.length} {days.length === 1 ? "day" : "days"} across{" "}
                {stops.length} {stops.length === 1 ? "stop" : "stops"}.
              </p>
            </>
          ) : (
            <>
              <p className="mt-3 text-2xl font-semibold">Nowhere yet</p>
              <p className="mt-2 text-sm opacity-75">
                No route has been laid out — an early enough moment to shape it.
              </p>
            </>
          )}
        </section>

        {/* Not a paywall — it's other people's information, and it opens the
            moment you're one of them. */}
        <section className="relative overflow-hidden rounded-lg bg-sheet p-6 sm:col-span-2">
          <div aria-hidden className="select-none blur-[5px] opacity-45">
            <p className="typed">Who is going, and what it has cost</p>
            <p className="mt-3 text-2xl font-semibold">
              {memberCount} {memberCount === 1 ? "person" : "people"}
            </p>
            <p className="mt-2 text-sm">
              Names, faces, the running total and everything the group has said.
            </p>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-sm font-medium">Join to see</p>
            <p className="max-w-[34ch] text-xs text-ink-soft">
              Who is going and what has been spent belong to the people in the
              trip.
            </p>
          </div>
        </section>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        {join}
        <p className="text-sm text-ink-soft">
          Joining puts you in the group. You can leave at any time.
        </p>
      </div>
    </div>
  );
}

/** A link that has been revoked, or belongs to a trip that no longer exists. */
function DeadLink() {
  return (
    <div className="mx-auto w-full max-w-[42rem] px-4 pb-20 pt-16 text-center sm:px-6">
      <PageTitle>This link no longer works</PageTitle>
      <p className="mx-auto mt-4 max-w-[48ch] text-md text-ink-soft">
        The trip may have been deleted, or the invite link replaced. Ask whoever
        sent it for a fresh one — a new link takes them a moment to make.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink variant="primary" href="/">
          What Floc is
        </ButtonLink>
        <ButtonLink variant="secondary" href="/trips">
          Your own trips
        </ButtonLink>
      </div>
    </div>
  );
}
