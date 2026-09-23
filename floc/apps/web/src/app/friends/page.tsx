/**
 * Friends (ticket 18; redesigned 201): accepted friends, incoming requests to
 * act on, outgoing requests still pending, and finding someone new by name or
 * friend code (#360) — never by email address.
 */
import { acceptFriend, declineFriend, cancelRequest, removeFriend } from "./actions";
import { requireUser } from "@/server/access";
import {
  coTripNameFor,
  listFriendshipsFor,
  peopleByIds,
  splitFriendships,
  syncCompletedCoTripFriendships,
  type Person,
} from "@/server/social/friends";
import { AccountPage, Panel, PersonRow } from "@/components/auth/account-ui";
import { Avatar, Badge, EmptyState } from "@/components/system/ui";
import { ConfirmSubmit, CopyLink, SubmitButton } from "@/components/system/client-ui";
import { PersonLink } from "@/components/social/person-link";
import { FindFriend } from "@/components/social/find-friend";
import { friendCodeFor } from "@/server/social/friend-code";

const UNKNOWN = (id: string): Person => ({ id, name: "Someone", avatarIcon: null });

export const metadata = { title: "Friends" };

export default async function FriendsPage() {
  const viewer = await requireUser("/friends");

  // Lazy reconciliation — v1 has no cron, so a completed co-trip only turns
  // into a friendship the next time either party loads this page.
  await syncCompletedCoTripFriendships(viewer.id);

  const [rows, code] = await Promise.all([
    listFriendshipsFor(viewer.id),
    friendCodeFor(viewer.id),
  ]);
  const { accepted, incoming, outgoing } = splitFriendships(rows, viewer.id);

  const otherIdOf = (r: (typeof rows)[number]) =>
    r.userId === viewer.id ? r.friendId : r.userId;

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

  return (
    <AccountPage
      eyebrow="Your people"
      title="Friends"
    >
      {/* Requests come first, and the incoming ones are blue: they're the only
          thing on the page waiting on you. */}
      <Panel
        title="Requests"
        className={incomingPeople.length > 0 ? "bg-pen-soft text-pen-deep" : undefined}
      >
        {incomingPeople.length === 0 && outgoingPeople.length === 0 ? (
          <EmptyState title="No requests yet" />
        ) : (
          <ul className="flex flex-col gap-2">
            {incomingPeople.map(({ requesterId, person }) => (
              <PersonRow key={requesterId} className="bg-sheet">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar name={person.name} icon={person.avatarIcon} />
                  <span className="min-w-0 truncate text-sm text-ink">
                    {person.name}
                  </span>
                  <Badge tone="open">wants to be friends</Badge>
                </div>
                <div className="flex gap-2">
                  <form action={acceptFriend}>
                    <input type="hidden" name="requesterId" value={requesterId} />
                    <SubmitButton variant="primary" pendingLabel="Accepting…">
                      Accept
                    </SubmitButton>
                  </form>
                  <form action={declineFriend}>
                    <input type="hidden" name="requesterId" value={requesterId} />
                    <SubmitButton variant="secondary" pendingLabel="Declining…">
                      Decline
                    </SubmitButton>
                  </form>
                </div>
              </PersonRow>
            ))}
            {outgoingPeople.map(({ targetId, person }) => (
              <PersonRow key={targetId} className="bg-sheet">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar name={person.name} icon={person.avatarIcon} />
                  <span className="min-w-0 truncate text-sm text-ink">
                    {person.name}
                  </span>
                  <Badge tone="neutral">requested — pending</Badge>
                </div>
                <form action={cancelRequest}>
                  <input type="hidden" name="targetId" value={targetId} />
                  <SubmitButton variant="secondary" pendingLabel="Cancelling…">
                    Cancel
                  </SubmitButton>
                </form>
              </PersonRow>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title="Find someone"
        aside={
          <span className="flex items-center gap-2">
            <span className="typed">Your code</span>
            <span className="font-mono text-sm text-ink">{code}</span>
            <CopyLink value={code} label="Copy" variant="ghost" />
          </span>
        }
      >
        <FindFriend />
      </Panel>

      <Panel
        title="Your friends"
        aside={
          acceptedPeople.length > 0 ? (
            <Badge tone="neutral">{acceptedPeople.length}</Badge>
          ) : null
        }
      >
        {acceptedPeople.length === 0 ? (
          <EmptyState title="No friends yet" />
        ) : (
          <ul className="flex flex-col gap-2">
            {acceptedPeople.map(({ person, metOn }) => (
              <PersonRow key={person.id}>
                <div className="flex min-w-0 items-center gap-2">
                  {/* Accepted friends only — a pending request doesn't put you
                      in anyone's ring yet, so the link would 404 (ticket 46). */}
                  <PersonLink
                    userId={person.id}
                    name={person.name}
                    avatarIcon={person.avatarIcon}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm">{person.name}</p>
                    {/* Quiet distinction (ticket 18): auto-added friends get a
                        caption, not a loud badge, naming the trip if known. */}
                    {metOn ? (
                      <p className="text-xs text-ink-faint">Met on {metOn}</p>
                    ) : null}
                  </div>
                </div>
                <form action={removeFriend}>
                  <input type="hidden" name="otherId" value={person.id} />
                  <ConfirmSubmit
                    variant="danger"
                    message={`Remove ${person.name} as a friend?`}
                    confirmLabel="Remove friend"
                  >
                    Remove
                  </ConfirmSubmit>
                </form>
              </PersonRow>
            ))}
          </ul>
        )}
      </Panel>
    </AccountPage>
  );
}
