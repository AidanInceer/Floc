/**
 * Friends (ticket 18): accepted friends, incoming requests to act on, and
 * outgoing requests still pending. There's no add-a-friend form here — you
 * meet people by sharing a trip, then send the request from their profile or
 * their roster row.
 */
import { acceptFriend, declineFriend, cancelRequest, removeFriend } from "./actions";
import { requireUser } from "@/server/access";
import {
  coTripNameFor,
  listFriendshipsFor,
  peopleByIds,
  syncCompletedCoTripFriendships,
  type Person,
} from "@/server/friends";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Page,
  PageHeader,
  Stack,
} from "@/components/ui";
import { SubmitButton } from "@/components/client-ui";
import { PersonLink } from "@/components/person-link";

const UNKNOWN = (id: string): Person => ({ id, name: "Someone", avatarUrl: null });

export default async function FriendsPage() {
  const viewer = await requireUser("/friends");

  // Lazy reconciliation — v1 has no cron, so a completed co-trip only turns
  // into a friendship the next time either party loads this page.
  await syncCompletedCoTripFriendships(viewer.id);

  const rows = await listFriendshipsFor(viewer.id);

  const accepted = rows.filter((r) => r.status === "accepted");
  const incoming = rows.filter((r) => r.status === "pending" && r.friendId === viewer.id);
  const outgoing = rows.filter((r) => r.status === "pending" && r.userId === viewer.id);

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
    <Page>
      <PageHeader
        title="Friends"
        subtitle="People you've travelled with, or asked to travel with."
      />
      <Stack gap={6}>
        <Card>
          <CardHeader title="Requests" hint="Waiting on you, or waiting on them." />
          <div className="p-4">
            {incomingPeople.length === 0 && outgoingPeople.length === 0 ? (
              <p className="text-sm text-ink-soft">No open requests.</p>
            ) : (
              <Stack gap={3}>
                {incomingPeople.map(({ requesterId, person }) => (
                  <div key={requesterId} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={person.name} src={person.avatarUrl} />
                      <span className="text-sm">{person.name}</span>
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
                        <SubmitButton variant="ghost" pendingLabel="Declining…">
                          Decline
                        </SubmitButton>
                      </form>
                    </div>
                  </div>
                ))}
                {outgoingPeople.map(({ targetId, person }) => (
                  <div key={targetId} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={person.name} src={person.avatarUrl} />
                      <span className="text-sm">{person.name}</span>
                      <Badge tone="neutral">requested — pending</Badge>
                    </div>
                    <form action={cancelRequest}>
                      <input type="hidden" name="targetId" value={targetId} />
                      <SubmitButton variant="ghost" pendingLabel="Cancelling…">
                        Cancel
                      </SubmitButton>
                    </form>
                  </div>
                ))}
              </Stack>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Your friends" />
          <div className="p-4">
            {acceptedPeople.length === 0 ? (
              <EmptyState title="No friends yet">
                Friends appear here once a trip you shared has ended, or once someone
                accepts your request.
              </EmptyState>
            ) : (
              <Stack gap={3}>
                {acceptedPeople.map(({ person, metOn }) => (
                  <div key={person.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {/* Accepted friends only — a pending request doesn't put
                          you in anyone's ring yet, so the link above would 404
                          (ticket 46). */}
                      <PersonLink
                        userId={person.id}
                        name={person.name}
                        avatarUrl={person.avatarUrl}
                      />
                      <div>
                        <p className="text-sm">{person.name}</p>
                        {/* Quiet distinction (ticket 18): auto-added friends get a
                            caption, not a loud badge, naming the trip if known. */}
                        {metOn ? (
                          <p className="text-xs text-ink-faint">Met on {metOn}</p>
                        ) : null}
                      </div>
                    </div>
                    <form action={removeFriend}>
                      <input type="hidden" name="otherId" value={person.id} />
                      <Button variant="ghost" type="submit">
                        Remove
                      </Button>
                    </form>
                  </div>
                ))}
              </Stack>
            )}
          </div>
        </Card>
      </Stack>
    </Page>
  );
}
