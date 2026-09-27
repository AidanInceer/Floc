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
import { Avatar, EmptyState, PageTitle, menuDangerItemClass } from "@/components/system/ui";
import { ConfirmSubmit, CopyLink, Menu, SubmitButton } from "@/components/system/client-ui";
import { PersonLink } from "@/components/social/person-link";
import { FindFriend } from "@/components/social/find-friend";
import { friendCodeFor } from "@/server/social/friend-code";

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

  const [rows, code] = await Promise.all([listFriendshipsFor(viewer.id), friendCodeFor(viewer.id)]);
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
    <div className="mx-auto w-full max-w-[41.25rem] px-4 pb-20 pt-6">
      <PageTitle>Friends</PageTitle>

      {/* Requests lead because they are the only thing here waiting on you; none, no strip. */}
      {requests > 0 ? (
        <section className="mt-6">
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
                  <SubmitButton variant="primary" pendingLabel="Accepting…" className={SMALL}>
                    Accept
                  </SubmitButton>
                </form>
                <form action={declineFriend}>
                  <input type="hidden" name="requesterId" value={requesterId} />
                  <SubmitButton variant="secondary" pendingLabel="Declining…" className={SMALL}>
                    Decline
                  </SubmitButton>
                </form>
              </FriendRow>
            ))}
            {outgoingPeople.map(({ targetId, person }) => (
              <FriendRow key={targetId} person={person} note="Requested · pending">
                <form action={cancelRequest}>
                  <input type="hidden" name="targetId" value={targetId} />
                  <SubmitButton variant="secondary" pendingLabel="Cancelling…" className={SMALL}>
                    Cancel
                  </SubmitButton>
                </form>
              </FriendRow>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="my-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
        <div className="min-w-0 flex-1">
          <FindFriend />
        </div>
        <span className="flex h-10 shrink-0 items-center justify-end gap-2 whitespace-nowrap text-xs">
          <span className="text-ink-soft">Your code</span>
          <span className="font-mono text-ink">{code}</span>
          <CopyLink value={code} label="Copy" variant="secondary" />
        </span>
      </div>

      <div className="mt-7 flex items-baseline justify-between gap-3">
        <h2 className="text-[0.95rem] font-semibold">Your friends</h2>
        <span className="nums font-mono text-xs text-ink-soft">{acceptedPeople.length}</span>
      </div>
      {acceptedPeople.length === 0 ? (
        <EmptyState title="No friends yet" />
      ) : (
        <ul className="mt-2.5 border-t border-rule">
          {acceptedPeople.map(({ person, metOn }) => (
            // Accepted friends only link through — a pending request doesn't put you in anyone's ring yet (ticket 46).
            <FriendRow
              key={person.id}
              person={person}
              note={metOn ? `Met on ${metOn}` : null}
              linked
            >
              <Menu label={`More for ${person.name}`}>
                <form action={removeFriend}>
                  <input type="hidden" name="otherId" value={person.id} />
                  <ConfirmSubmit
                    variant="ghost"
                    message={`Remove ${person.name} as a friend?`}
                    confirmLabel="Remove friend"
                    className={menuDangerItemClass}
                  >
                    Remove friend
                  </ConfirmSubmit>
                </form>
              </Menu>
            </FriendRow>
          ))}
        </ul>
      )}
    </div>
  );
}

const SMALL = "!min-h-0 !px-2.5 !py-1 !text-xs";

function FriendRow({
  person,
  note,
  linked,
  children,
}: {
  person: Person;
  note?: string | null;
  linked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="flex min-h-15 items-center gap-3 border-b border-rule px-1 py-2">
      {linked ? (
        <PersonLink
          userId={person.id}
          name={person.name}
          avatarIcon={person.avatarIcon}
          size={34}
        />
      ) : (
        <Avatar name={person.name} icon={person.avatarIcon} size={34} />
      )}
      <div className="flex min-w-0 flex-1 flex-col leading-snug">
        <span className="truncate text-sm font-medium">{person.name}</span>
        {note ? <span className="text-xs text-ink-soft">{note}</span> : null}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">{children}</div>
    </li>
  );
}
