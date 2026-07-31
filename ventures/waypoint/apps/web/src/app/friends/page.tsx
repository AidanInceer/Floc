/**
 * Friends (ticket 18): accepted friends, incoming requests to act on,
 * outgoing requests still pending, and an add-by-email form — the form is
 * how a profile-bubble tap resolves when the two people don't already share
 * a trip (ticket 01 step 2).
 */
import { and, eq, isNull, or } from "drizzle-orm";

import { requestFriend, acceptFriend, declineFriend, cancelRequest, removeFriend } from "./actions";
import { db } from "@/db";
import { friendship, user, userProfile } from "@/db/schema";
import { requireUser } from "@/lib/access";
import { coTripNameFor, syncCompletedCoTripFriendships } from "@/lib/friends";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Page,
  PageHeader,
  Stack,
} from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/client-ui";
import { PersonLink } from "@/components/person-link";

type Person = { id: string; name: string; avatarUrl: string | null };

async function personFor(userId: string): Promise<Person> {
  const row = await db
    .select({ name: user.name, image: user.image, displayName: userProfile.displayName, avatarUrl: userProfile.avatarUrl })
    .from(user)
    .leftJoin(userProfile, eq(userProfile.userId, user.id))
    .where(eq(user.id, userId))
    .get();
  return {
    id: userId,
    name: row?.displayName ?? row?.name ?? "Someone",
    avatarUrl: row?.avatarUrl ?? row?.image ?? null,
  };
}

export default async function FriendsPage() {
  const viewer = await requireUser("/friends");

  // Lazy reconciliation — v1 has no cron, so a completed co-trip only turns
  // into a friendship the next time either party loads this page.
  await syncCompletedCoTripFriendships(viewer.id);

  const rows = await db
    .select()
    .from(friendship)
    .where(
      and(
        isNull(friendship.deletedAt),
        or(eq(friendship.userId, viewer.id), eq(friendship.friendId, viewer.id)),
      ),
    )
    .all();

  const accepted = rows.filter((r) => r.status === "accepted");
  const incoming = rows.filter((r) => r.status === "pending" && r.friendId === viewer.id);
  const outgoing = rows.filter((r) => r.status === "pending" && r.userId === viewer.id);

  const acceptedPeople = await Promise.all(
    accepted.map(async (r) => {
      const otherId = r.userId === viewer.id ? r.friendId : r.userId;
      const person = await personFor(otherId);
      // Ticket 18: distinguish auto (co_trip) from manual (request) friends
      // quietly — a small caption, not a badge, naming the trip if we know it.
      const metOn = r.origin === "co_trip" ? await coTripNameFor(viewer.id, otherId) : null;
      return { person, origin: r.origin, metOn };
    }),
  );

  const incomingPeople = await Promise.all(
    incoming.map(async (r) => ({ requesterId: r.userId, person: await personFor(r.userId) })),
  );
  const outgoingPeople = await Promise.all(
    outgoing.map(async (r) => ({ targetId: r.friendId, person: await personFor(r.friendId) })),
  );

  return (
    <Page>
      <PageHeader
        title="Friends"
        subtitle="People you've travelled with, or asked to travel with."
      />
      <Stack gap={6}>
        <Card>
          <CardHeader
            title="Add a friend"
            hint="Send a request by email — this is what a profile-bubble tap does when you don't already share a trip."
          />
          <div className="p-4">
            <ActionForm action={requestFriend} className="flex flex-wrap items-end gap-3">
              <Field label="Email" className="min-w-[220px] flex-1">
                <Input type="email" name="email" placeholder="friend@example.com" required />
              </Field>
              <SubmitButton pendingLabel="Sending…">Send request</SubmitButton>
            </ActionForm>
          </div>
        </Card>

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
