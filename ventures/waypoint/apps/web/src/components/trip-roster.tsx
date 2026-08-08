/**
 * "Who's going" — the right half of the Overview hero (v0.2 ticket 07).
 * Replaces the Chase panel, which was two columns of nudge targets sitting a
 * screen below an Unresolved list built from the same three checks.
 *
 * The roster owns chasing now, because chasing is a thing you do *to someone*:
 * every member's row carries it, and Unresolved just says what is outstanding.
 * Neither says the other's half. Ticket 125 put nudging, promoting and
 * removing behind one triple-dot per row rather than a line of icons.
 *
 * Nudging is still peer-to-peer with no deadlines and no escalation (v1
 * ticket 05), and the nudge itself is delivered by email in `sendNudge` — so
 * dropping the old "waiting on you" list doesn't leave nudges undeliverable.
 */
import { Avatar, Badge } from "@/components/ui";
import { PersonLink } from "@/components/person-link";
import { FriendButton } from "@/components/friend-button";
import { FriendPicker } from "@/components/friend-picker";
import type { FriendState, Person } from "@/server/friends";
import type { PendingInvitee } from "@/server/membership";
import { Field, Select, Stack, Textarea } from "@/components/ui";
import {
  ConfirmSubmit,
  CopyLink,
  Menu,
  Sheet,
  SubmitButton,
  menuDangerItemClass,
  menuItemClass,
} from "@/components/client-ui";
import { NUDGE_TABS } from "@/db/schema";
import type { TripMember } from "@/server/access";
import {
  inviteFriends,
  kickMember,
  promoteMember,
  sendNudge,
} from "@/app/trip/[id]/overview/actions";

const TAB_LABELS: Record<string, string> = {
  ideas: "Ideas",
  route: "Route",
  days: "Days",
  money: "Money",
};

export function TripRoster({
  tripId,
  viewerId,
  members,
  isAdmin,
  inviteUrl,
  friendStates,
  pendingInvitees,
  friends,
}: {
  tripId: number;
  viewerId: string;
  members: TripMember[];
  isAdmin: boolean;
  /** Absent for a non-admin — inviting is one of the four admin powers. */
  inviteUrl?: string;
  /** userId → where you stand with them (ticket 96), resolved in one query. */
  friendStates: Map<string, FriendState>;
  /** Asked by name and yet to answer (ticket 146). Shown to every member. */
  pendingInvitees: PendingInvitee[];
  /** The viewer's friends, for the picker. Empty for a non-admin. */
  friends: Person[];
}) {
  return (
    <section className="tape-panel rounded-md border border-rule-strong bg-sheet-2 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-rule-strong pb-2">
        <h2 className="text-[15px] font-semibold">Who&rsquo;s going</h2>
        {/*
          The invite URL never appears on the page — a link sitting in the open
          reads as something you have to deal with, and it's the one string
          that shouldn't be read off a shared screen. The button copies it.
        */}
        {inviteUrl ? (
          <span className="flex items-center gap-2">
            {/* Named invites first (ticket 146): asking a friend you already
                have is one tap, and the link is the fallback for everyone
                else. Both are the same admin power (rule 6). */}
            <Sheet
              trigger="Invite friends"
              title="Invite friends"
              triggerVariant="secondary"
            >
              <form action={inviteFriends}>
                <input type="hidden" name="tripId" value={tripId} />
                <Stack gap={3}>
                  <FriendPicker
                    friends={friends}
                    excludeIds={[
                      ...members.map((m) => m.userId),
                      ...pendingInvitees.map((p) => p.userId),
                    ]}
                    emptyNote="Everyone you're friends with is already on this trip, or has been asked."
                  />
                  <SubmitButton pendingLabel="Inviting…">Send invites</SubmitButton>
                </Stack>
              </form>
            </Sheet>
            <CopyLink value={inviteUrl} label="Share trip" variant="primary" icon={<ShareIcon />} />
          </span>
        ) : null}
      </div>

      <ul className="mt-1">
        {members.map((m) => (
          <li
            key={m.userId}
            className="flex items-center gap-2 border-b border-dotted border-rule-strong py-1.5 last:border-b-0"
          >
            <span className="flex min-w-0 flex-1 items-center gap-2 text-sm">
              {/* Every face is a way into that person's profile (ticket 46) —
                  sharing this trip puts you in their trip-members ring. */}
              <PersonLink
                userId={m.userId}
                name={m.name}
                avatarUrl={m.avatarUrl}
                size={26}
                tone={m.tone}
                isYou={m.userId === viewerId}
              />
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="truncate">{m.name}</span>
                  {m.userId === viewerId ? (
                    <span className="text-xs text-ink-faint">(you)</span>
                  ) : null}
                  {m.role === "admin" ? <Badge tone="marine">Admin</Badge> : null}
                </span>
                {/* Dietary never shows on a profile page — it shows here, where
                    a group picking somewhere to eat needs it (ticket 46), and
                    only for people who chose to share it. */}
                {m.dietary ? (
                  <span className="block truncate text-xs text-ink-faint">
                    {m.dietary}
                  </span>
                ) : null}
              </span>
            </span>

            {/* Someone you're planning a trip with is someone you can ask
                (ticket 96) — the same control the profile page carries, cut
                down to fit a row. Nothing on your own row. */}
            {m.userId !== viewerId ? (
              <FriendButton
                userId={m.userId}
                name={m.name}
                state={friendStates.get(m.userId) ?? "none"}
                compact
              />
            ) : null}

            {/*
              Everything you do *to* someone lives behind one triple-dot
              (ticket 125). The row used to end in a bell, a boot and — for an
              admin — a Promote button a screen away in Trip settings, which is
              three or four targets on a line whose actual job is to say who is
              coming. Nudging is what most people came for, so it leads.

              Nothing on your own row: you can't chase yourself, leaving a trip
              isn't a kick, and an admin booting themselves out of their own
              trip is a foot-gun rather than a feature.
            */}
            {m.userId !== viewerId ? (
              <Menu label={`Actions for ${m.name}`}>
                <Sheet
                  trigger="Nudge"
                  triggerVariant="ghost"
                  triggerClassName={menuItemClass}
                  title={`Nudge ${m.name}`}
                >
                  {/* A real Server Action ref, so it survives the server→client
                     boundary — a wrapping closure would not. */}
                  <form action={sendNudge}>
                    <input type="hidden" name="tripId" value={tripId} />
                    <input type="hidden" name="toUserId" value={m.userId} />
                    <Stack gap={3}>
                      <Field label="What's it about">
                        <Select name="tab" defaultValue={NUDGE_TABS[0]}>
                          {NUDGE_TABS.map((t) => (
                            <option key={t} value={t}>
                              {TAB_LABELS[t] ?? t}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Message (optional)">
                        <Textarea
                          name="message"
                          placeholder={`e.g. "Can you vote on the ideas before the weekend?"`}
                        />
                      </Field>
                      <SubmitButton pendingLabel="Sending…">Send nudge</SubmitButton>
                    </Stack>
                  </form>
                </Sheet>

                {/* Promote and kick are two of the four admin powers
                    (CLAUDE.md rule 6); both stay gated server-side, and
                    rendering them conditionally here is presentation. */}
                {isAdmin && m.role !== "admin" ? (
                  <form action={promoteMember}>
                    <input type="hidden" name="tripId" value={tripId} />
                    <input type="hidden" name="userId" value={m.userId} />
                    <SubmitButton
                      variant="ghost"
                      pendingLabel="…"
                      className={menuItemClass}
                    >
                      Make admin
                    </SubmitButton>
                  </form>
                ) : null}

                {isAdmin ? (
                  <form action={kickMember}>
                    <input type="hidden" name="tripId" value={tripId} />
                    <input type="hidden" name="userId" value={m.userId} />
                    <ConfirmSubmit
                      variant="ghost"
                      message={`Remove ${m.name} from this trip? Anything they've already posted stays on the board.`}
                      confirmLabel="Remove them"
                      pendingLabel="…"
                      className={menuDangerItemClass}
                    >
                      Remove from trip
                    </ConfirmSubmit>
                  </form>
                ) : null}
              </Menu>
            ) : (
              // Keeps every name on the same left edge whether or not the row
              // ends in a menu.
              <span aria-hidden="true" className="h-[26px] w-[26px]" />
            )}
          </li>
        ))}
        {/* Asked, not answered (ticket 146). In the same list rather than a
            panel of its own — "who's going" is one question, and an invite out
            is part of the answer. Muted and captioned, never a face in the
            count: nobody here is on the trip yet, and the word carries the
            state rather than the grey doing it alone. */}
        {pendingInvitees.map((p) => (
          <li
            key={p.userId}
            className="flex items-center gap-2 border-b border-dotted border-rule-strong py-1.5 last:border-b-0"
          >
            <span className="flex min-w-0 flex-1 items-center gap-2 text-sm text-ink-soft">
              <span className="opacity-60">
                <Avatar name={p.name} src={p.avatarUrl} size={26} />
              </span>
              <span className="min-w-0 truncate">{p.name}</span>
              <Badge tone="neutral">Invited</Badge>
            </span>
            <span aria-hidden="true" className="h-[26px] w-[26px]" />
          </li>
        ))}
      </ul>

      {isAdmin && members.length === 1 && pendingInvitees.length === 0 ? (
        <p className="mt-3 text-xs text-ink-faint">
          Just you so far — share the trip to get the others in.
        </p>
      ) : null}
    </section>
  );
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}
