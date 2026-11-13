/**
 * Friends (ticket 18; redesigned 201): accepted friends, incoming requests to
 * act on, outgoing requests still pending, and finding someone new by name or
 * full friend tag — never by email address.
 */
import { acceptFriend, declineFriend, cancelRequest } from "./actions";
import { today } from "@floc/core/dates/dates";
import { requireUser } from "@/server/access";
import {
  coTripNameFor,
  listFriendshipsFor,
  peopleByIds,
  splitFriendships,
  syncCompletedCoTripFriendships,
  type Person,
} from "@/server/social/friends";
import { PageTitle } from "@/components/system/ui";
import { CopyLink, SubmitButton } from "@/components/system/client-ui";
import { FriendRow } from "@/components/social/friend-row";
import { FriendsBoard } from "@/components/social/groups/friends-board";
import { FindFriend } from "@/components/social/find-friend";
import { AccountTabs } from "@/components/chrome/account-tabs";
import { friendCodeFor } from "@/server/social/friend-code";
import { listGroupsFor, listPastTripsFor } from "@/server/social/groups";

const UNKNOWN = (id: string): Person => ({
  id,
  name: "Someone",
  avatarIcon: null,
});

export const metadata = { title: "Friends" };

export default async function FriendsPage() {
  const viewer = await requireUser("/friends");

  // Lazy reconciliation — v1 has no cron, so a completed co-trip only turns
  // into a friendship the next time either party loads this page.
  await syncCompletedCoTripFriendships(viewer.id);

  const [rows, tag, groups, pastTrips] = await Promise.all([
    listFriendshipsFor(viewer.id),
    friendCodeFor(viewer.id),
    listGroupsFor(viewer.id),
    listPastTripsFor(viewer.id, today()),
  ]);
  const { accepted, incoming, outgoing } = splitFriendships(rows, viewer.id);

  const otherIdOf = (r: (typeof rows)[number]) => (r.userId === viewer.id ? r.friendId : r.userId);

  // Every face on the page in one query, rather than one per row — this was an
  // await inside a `.map`, so a hundred friends was a hundred serial round
  // trips (ticket 118).
  const people = await peopleByIds(rows.map(otherIdOf));
  const personFor = (id: string) => people.get(id) ?? UNKNOWN(id);

  const acceptedPeople = await Promise.all(
    accepted.map(async (r) => {
      const otherId = otherIdOf(r);
      // Ticket 18: distinguish auto (co_trip) from manual (request) friends
      // quietly — a small caption, not a badge, naming the trip if we know it.
      const metOn = r.origin === "co_trip" ? await coTripNameFor(viewer.id, otherId) : null;
      return { person: personFor(otherId), origin: r.origin, metOn };
    }),
  );

  const incomingPeople = incoming.map((r) => ({
    requesterId: r.userId,
    person: personFor(r.userId),
  }));
  const outgoingPeople = outgoing.map((r) => ({
    targetId: r.friendId,
    person: personFor(r.friendId),
  }));

  const requests = incomingPeople.length + outgoingPeople.length;

  return (
    <>
    <AccountTabs current="friends" userId={viewer.id} />
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <PageTitle className="sr-only">Friends</PageTitle>
      <div className="mx-auto max-w-[41.25rem]">
        {/* Requests lead because they are the only thing here waiting on you; none, no strip. */}
        {requests > 0 ? (
          <section>
            <h2 className="flex items-center gap-2 text-sm font-medium">
              Requests
              <span className="nums inline-grid size-5 place-items-center rounded-full bg-pen-soft font-mono text-xs text-pen-deep">
                {requests}
              </span>
            </h2>
            <ul className="mt-1.5">
              {incomingPeople.map(({ requesterId, person }) => (
                <FriendRow key={requesterId} person={person} note="Wants to be friends">
                  <form action={acceptFriend}>
                    <input type="hidden" name="requesterId" value={requesterId} />
                    <SubmitButton variant="primary" className={SMALL}>
                      Accept
                    </SubmitButton>
                  </form>
                  <form action={declineFriend}>
                    <input type="hidden" name="requesterId" value={requesterId} />
                    <SubmitButton variant="secondary" className={SMALL}>
                      Decline
                    </SubmitButton>
                  </form>
                </FriendRow>
              ))}
              {outgoingPeople.map(({ targetId, person }) => (
                <FriendRow key={targetId} person={person} note="Requested · pending">
                  <form action={cancelRequest}>
                    <input type="hidden" name="targetId" value={targetId} />
                    <SubmitButton variant="secondary" className={SMALL}>
                      Cancel
                    </SubmitButton>
                  </form>
                </FriendRow>
              ))}
            </ul>
          </section>
        ) : null}

        <div className={requests > 0 ? "my-6 flex flex-col gap-3" : "mb-6 flex flex-col gap-3"}>
          <FindFriend />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-soft">Your friend tag</span>
            <span className="min-w-0 break-words font-mono text-xs text-ink">{tag}</span>
            <CopyLink value={tag} label="Copy friend tag" item="Friend tag" variant="secondary" />
          </div>
        </div>

        <FriendsBoard show="friends" friends={acceptedPeople} groups={groups} pastTrips={pastTrips} />
      </div>
    </div>
    </>
  );
}

const SMALL = "!min-h-0 !px-2.5 !py-1 !text-xs";
