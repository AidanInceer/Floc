// Who's going: one chip per person; everything done *to* someone sits behind their chip (ticket 125).
import Link from "next/link";

import { Avatar, Field, Select, Stack, Textarea, cx, menuDangerItemClass, menuItemClass } from "@/components/system/ui";
import { ConfirmSubmit, CopyLink, Menu, Sheet, SubmitButton } from "@/components/system/client-ui";
import { FriendButton } from "@/components/social/friend-button";
import { FriendPicker } from "@/components/social/friend-picker";
import type { FriendState, Person } from "@/server/social/friends";
import type { PendingInvitee } from "@/server/trips/invites";
import type { TripMember } from "@/server/access";
import { NUDGE_TABS } from "@/db/schema";
import { TAB_LABELS } from "@/lib/tabs";
import { inviteFriends, kickMember, promoteMember, sendNudge } from "@/app/trip/[id]/overview/actions";

type Props = {
  tripId: number;
  viewerId: string;
  members: TripMember[];
  isAdmin: boolean;
  inviteUrl: string;
  friendStates: Map<string, FriendState>;
  pendingInvitees: PendingInvitee[];
  declinedInvitees: PendingInvitee[];
  friends: Person[];
  /** Still to add their free days, while the trip is undated. */
  needDates: Set<string>;
};

export function OverviewGroup(props: Props) {
  const { members, pendingInvitees, declinedInvitees } = props;
  return (
    <section id="the-group" data-tour="roster" className="flex min-w-0 scroll-mt-24 flex-col gap-3 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg">
          Who&rsquo;s going
          <span className="nums text-xs font-normal text-ink-faint">{members.length}</span>
        </h2>
        <span className="ml-auto flex flex-wrap items-center gap-2">
          <InviteSheet {...props} />
          <CopyLink value={props.inviteUrl} label="Share trip" variant="primary" icon={<ShareIcon />} />
        </span>
      </div>
      <ul className="flex flex-wrap items-center gap-1.5">
        {members.map((m) => (
          <li key={m.userId}>
            <MemberChip {...props} member={m} />
          </li>
        ))}
        {pendingInvitees.map((p) => (
          <li key={p.userId}>
            <InviteeChip person={p} word="Invited" />
          </li>
        ))}
        {declinedInvitees.map((p) => (
          <li key={p.userId}>
            <InviteeChip person={p} word="Declined" />
          </li>
        ))}
      </ul>
    </section>
  );
}

const chip =
  "inline-flex items-center gap-2 rounded-full border border-rule bg-sheet py-[3px] pl-[3px] pr-3 text-sm text-ink";
const word = "font-mono text-[10px] uppercase tracking-[0.06em]";

function MemberChip({
  tripId,
  viewerId,
  isAdmin,
  friendStates,
  needDates,
  member: m,
}: Props & { member: TripMember }) {
  const you = m.userId === viewerId;
  return (
    <Menu
      label={`${m.name}${you ? " (you)" : ""}`}
      align="left"
      triggerClassName={cx(chip, "lift hover:border-rule-strong")}
      trigger={
        <>
          <Avatar name={m.name} icon={m.avatarIcon} size={22} tone={m.tone} />
          {m.name.split(" ")[0]}
          {you ? <span className="text-ink-faint">you</span> : null}
          {m.role === "admin" ? <span className={cx(word, "text-pen-deep")}>Admin</span> : null}
          {needDates.has(m.userId) ? <span className={cx(word, "text-highlight-ink")}>Dates to add</span> : null}
        </>
      }
    >
      <p className="border-b border-rule px-2.5 pb-2 pt-1.5 font-display text-sm font-semibold text-ink">{m.name}</p>
      <Link href={you ? "/profile" : `/profile/${m.userId}`} className={menuItemClass}>
        {you ? "Your profile" : "View profile"}
      </Link>
      {you ? null : (
        <>
          <NudgeSheet tripId={tripId} member={m} />
          <div className="px-2.5 py-1.5">
            <FriendButton userId={m.userId} name={m.name} state={friendStates.get(m.userId) ?? "none"} compact />
          </div>
          {/* Gated server-side; this is presentation only (rule 6). */}
          {isAdmin && m.role !== "admin" ? (
            <form action={promoteMember}>
              <input type="hidden" name="tripId" value={tripId} />
              <input type="hidden" name="userId" value={m.userId} />
              <SubmitButton variant="ghost" pendingLabel="…" className={menuItemClass}>
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
        </>
      )}
    </Menu>
  );
}

function InviteeChip({ person, word: status }: { person: PendingInvitee; word: string }) {
  return (
    <span className={cx(chip, "border-dashed text-ink-soft")}>
      <span className="opacity-60">
        <Avatar name={person.name} icon={person.avatarIcon} size={22} />
      </span>
      {person.name.split(" ")[0]}
      <span className={cx(word, "text-ink-faint")}>{status}</span>
    </span>
  );
}

function NudgeSheet({ tripId, member }: { tripId: number; member: TripMember }) {
  return (
    <Sheet trigger="Nudge" triggerVariant="ghost" triggerClassName={menuItemClass} title={`Nudge ${member.name}`}>
      <form action={sendNudge}>
        <input type="hidden" name="tripId" value={tripId} />
        <input type="hidden" name="toUserId" value={member.userId} />
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
            <Textarea name="message" placeholder={`e.g. "Can you put your dates in before the weekend?"`} />
          </Field>
          <SubmitButton pendingLabel="Sending…">Send nudge</SubmitButton>
        </Stack>
      </form>
    </Sheet>
  );
}

// Why: any member may invite, by name or by link (#312).
function InviteSheet({ tripId, members, pendingInvitees, friends, inviteUrl }: Props) {
  return (
    <Sheet trigger="Invite friends" title="Invite friends" triggerVariant="secondary">
      {friends.length === 0 ? (
        <Stack gap={3}>
          <p className="text-sm text-ink-soft">You have no friends on Floc yet. Share the trip link instead.</p>
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
              excludeIds={[...members.map((m) => m.userId), ...pendingInvitees.map((p) => p.userId)]}
              emptyNote="Everyone you're friends with is already on this trip, or has been asked."
            />
            <SubmitButton pendingLabel="Inviting…">Send invites</SubmitButton>
          </Stack>
        </form>
      )}
    </Sheet>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 14 14" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10.5" cy="3" r="1.6" />
      <circle cx="3.5" cy="7" r="1.6" />
      <circle cx="10.5" cy="11" r="1.6" />
      <path d="M5 7.8l4 2.4M9 3.8 5 6.2" />
    </svg>
  );
}
