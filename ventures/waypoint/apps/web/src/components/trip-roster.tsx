/**
 * "Who's going" — right half of the Overview hero (v0.2 ticket 07). Replaces
 * the old Chase panel; the roster owns chasing now since it's done *to
 * someone*, and ticket 125 put nudge/promote/remove behind one triple-dot per
 * row. Nudging stays peer-to-peer, no deadlines, delivered by email in `sendNudge`.
 */
import { Avatar, Badge, menuDangerItemClass, menuItemClass } from "@/components/ui";
import { PersonLink } from "@/components/person-link";
import { FriendButton } from "@/components/friend-button";
import { FriendPicker } from "@/components/friend-picker";
import type { FriendState, Person } from "@/server/friends";
import type { PendingInvitee } from "@/server/membership";
import { Field, Select, Stack, Textarea } from "@/components/ui";
import { ConfirmSubmit, CopyLink, Menu, Sheet, SubmitButton } from "@/components/client-ui";
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
    // A RAIL PANEL (ticket 209). It lives in Overview's narrow right column
    // now, so everything inside stacks: the title over its buttons, one member
    // per row. The old full-width two-column version was a panel of air on a
    // trip with three people — the list grows downward here instead.
    <section className="rounded-lg bg-sheet p-5 ring-1 ring-rule">
      <div className="border-b border-rule pb-3">
        <h2 className="font-display text-lg">The group</h2>
        {/* Invite URL never appears on the page — the button copies it instead. */}
        {inviteUrl ? (
          <span className="mt-3 flex flex-wrap items-center gap-2">
            {/* Named invites first (ticket 146), link as fallback; both the same admin power (rule 6). */}
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
                  <SubmitButton pendingLabel="Inviting…">
                    Send invites
                  </SubmitButton>
                </Stack>
              </form>
            </Sheet>
            <CopyLink
              value={inviteUrl}
              label="Share trip"
              variant="primary"
              icon={<ShareIcon />}
            />
          </span>
        ) : null}
      </div>

      <ul className="mt-3 flex flex-col gap-1.5">
        {members.map((m) => (
          <li
            key={m.userId}
            className="flex items-center gap-2 rounded-md bg-sheet-2 px-2.5 py-1.5"
          >
            <span className="flex min-w-0 flex-1 items-center gap-2 text-sm">
              {/* Every face links to that person's profile (ticket 46). */}
              <PersonLink
                userId={m.userId}
                name={m.name}
                avatarUrl={m.avatarUrl}
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
                    <Badge tone="marine">Admin</Badge>
                  ) : null}
                </span>
                {/* Dietary never shows on a profile page, only here (ticket 46). */}
                {m.dietary ? (
                  <span className="block truncate text-xs text-ink-faint">
                    {m.dietary}
                  </span>
                ) : null}
              </span>
            </span>

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
                          placeholder={`e.g. "Can you vote on the ideas before the weekend?"`}
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
          <li
            key={p.userId}
            className="flex items-center gap-2 rounded-md bg-sheet-2 px-2.5 py-1.5"
          >
            <span className="flex min-w-0 flex-1 items-center gap-2 text-sm opacity-75">
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
