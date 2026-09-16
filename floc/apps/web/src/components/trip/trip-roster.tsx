/**
 * "Who's going" — right half of the Overview hero (v0.2 ticket 07). Replaces
 * the old Chase panel; the roster owns chasing now since it's done *to
 * someone*, and ticket 125 put nudge/promote/remove behind one triple-dot per
 * row. Nudging stays peer-to-peer, no deadlines, delivered by email in `sendNudge`.
 */
import type { ReactNode } from "react";

import { Avatar, Badge, menuDangerItemClass, menuItemClass } from "@/components/system/ui";
import { PersonLink } from "@/components/social/person-link";
import { FriendButton } from "@/components/social/friend-button";
import { FriendPicker } from "@/components/social/friend-picker";
import type { FriendState, Person } from "@/server/social/friends";
import type { PendingInvitee } from "@/server/trips/invites";
import { Field, Select, Stack, Textarea } from "@/components/system/ui";
import { ConfirmSubmit, CopyLink, Menu, Sheet, SubmitButton } from "@/components/system/client-ui";
import { NUDGE_TABS } from "@/db/schema";
import { TAB_LABELS } from "@/lib/tabs";
import type { TripMember } from "@/server/access";
import {
  inviteFriends,
  kickMember,
  promoteMember,
  sendNudge,
} from "@/app/trip/[id]/overview/actions";

export function TripRoster({
  tripId,
  viewerId,
  members,
  isAdmin,
  inviteUrl,
  friendStates,
  pendingInvitees,
  declinedInvitees,
  friends,
  statuses,
  footer,
}: {
  /** userId → what they still owe the group, in words (`groupStatuses`). */
  statuses: Map<string, string[]>;
  /** Drawn flush along the panel's foot — Overview's spending strip. */
  footer?: ReactNode;
  tripId: number;
  viewerId: string;
  members: TripMember[];
  isAdmin: boolean;
  inviteUrl: string;
  /** userId → where you stand with them (ticket 96), resolved in one query. */
  friendStates: Map<string, FriendState>;
  /** Asked by name and yet to answer (ticket 146). Shown to every member. */
  pendingInvitees: PendingInvitee[];
  /** Said no; still askable, so the picker keeps offering them. */
  declinedInvitees: PendingInvitee[];
  friends: Person[];
}) {
  return (
    // A RAIL PANEL (ticket 209). It lives in Overview's narrow right column
    // now, so everything inside stacks: the title over its buttons, one member
    // per row. The old full-width two-column version was a panel of air on a
    // trip with three people — the list grows downward here instead.
    <section id="the-group" data-tour="roster" className="scroll-mt-24 rounded-lg bg-sheet p-5 ring-1 ring-rule">
      <div className="border-b border-rule pb-3">
        <h2 className="font-display text-lg">The group</h2>
        {/* Invite URL never appears on the page — the button copies it instead. */}
        {/* Why: any member may invite, by name or by link (#312). */}
        <span className="mt-3 flex flex-wrap items-center gap-2">
            <Sheet
              trigger="Invite friends"
              title="Invite friends"
              triggerVariant="secondary"
            >
              {friends.length === 0 ? (
                <Stack gap={3}>
                  <p className="text-sm text-ink-soft">
                    You have no friends on Floc yet. Share the trip link instead.
                  </p>
                  <span>
                    <CopyLink value={inviteUrl} label="Share trip" variant="primary" icon={<ShareIcon />} />
                  </span>
                </Stack>
              ) : (
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
                    <SubmitButton pendingLabel="Inviting…">
                      Send invites
                    </SubmitButton>
                  </Stack>
                </form>
              )}
            </Sheet>
            <CopyLink
              value={inviteUrl}
              label="Share trip"
              variant="primary"
              icon={<ShareIcon />}
            />
        </span>
      </div>

      <ul className="mt-3 flex flex-col gap-1.5">
        {members.map((m) => (
          <li
            key={m.userId}
            className="flex min-h-[52px] items-center gap-2 rounded-md bg-sheet-2 px-2.5 py-2"
          >
            <span className="flex min-w-0 flex-1 items-center gap-2.5 text-sm">
              {/* Every face links to that person's profile (ticket 46). */}
              <PersonLink
                userId={m.userId}
                name={m.name}
                avatarIcon={m.avatarIcon}
                size={26}
                tone={m.tone}
                isYou={m.userId === viewerId}
              />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="truncate">{m.name}</span>
                  {m.userId === viewerId ? (
                    <span className="text-xs opacity-60">(you)</span>
                  ) : null}
                  {m.role === "admin" ? (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-pen-deep">Admin</span>
                  ) : null}
                </span>
                {/* Dietary never shows on a profile page, only here (ticket 46). */}
                {m.dietary ? (
                  <span className="mt-0.5 block truncate text-xs text-ink-faint">{m.dietary}</span>
                ) : null}
              </span>
            </span>

            <MemberStatuses words={statuses.get(m.userId) ?? []} />

            {/* Same control as the profile page, cut down to fit a row (ticket 96). */}
            {m.userId !== viewerId ? (
              <FriendButton
                userId={m.userId}
                name={m.name}
                state={friendStates.get(m.userId) ?? "none"}
                compact
              />
            ) : null}

            {/* Everything done *to* someone behind one triple-dot (ticket 125).
                Nothing on your own row — can't chase yourself, and self-kick is a foot-gun. */}
            {m.userId !== viewerId ? (
              <Menu label={`Actions for ${m.name}`}>
                <Sheet
                  trigger="Nudge"
                  triggerVariant="ghost"
                  triggerClassName={menuItemClass}
                  title={`Nudge ${m.name}`}
                >
                  {/* Real Server Action ref — a wrapping closure wouldn't survive the boundary. */}
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
                          placeholder={`e.g. "Can you put your dates in before the weekend?"`}
                        />
                      </Field>
                      <SubmitButton pendingLabel="Sending…">
                        Send nudge
                      </SubmitButton>
                    </Stack>
                  </form>
                </Sheet>

                {/* Gated server-side; this is presentation only (rule 6). */}
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
        {/* Asked, not answered (ticket 146) — same list, not a separate panel. */}
        {pendingInvitees.map((p) => (
          <InviteeRow key={p.userId} person={p} status={<Badge tone="open">Invited</Badge>} />
        ))}
        {declinedInvitees.map((p) => (
          <InviteeRow key={p.userId} person={p} status={<Badge tone="neutral">Declined</Badge>} />
        ))}
      </ul>
      {footer ? <div className="-mx-5 -mb-5 mt-4">{footer}</div> : null}
    </section>
  );
}

function InviteeRow({ person, status }: { person: PendingInvitee; status: ReactNode }) {
  return (
    <li className="flex min-h-[52px] items-center gap-2 rounded-md bg-sheet-2 px-2.5 py-1.5">
      <span className="flex min-w-0 flex-1 items-center gap-2 text-sm">
        <span className="opacity-60">
          <Avatar name={person.name} icon={person.avatarIcon} size={26} />
        </span>
        <span className="min-w-0 truncate text-ink-soft">{person.name}</span>
        {status}
      </span>
      <span aria-hidden="true" className="h-[26px] w-[26px]" />
    </li>
  );
}

function MemberStatuses({ words }: { words: string[] }) {
  if (words.length === 0) return null;
  return (
    <span className="flex shrink-0 flex-col items-end gap-1">
      {words.map((word) => (
        <Badge key={word} tone="open">
          {word}
        </Badge>
      ))}
    </span>
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
