// Who's going, in one line: faces, a count and names. The faces open the full list.
import { goingNames, goingNotes } from "@floc/core/trip/overview/going";
import { AvatarRow, SheetFooter, Stack } from "@/components/system/ui";
import { CopyLink, Sheet, SubmitButton } from "@/components/system/client-ui";
import { FriendPicker } from "@/components/social/friend-picker";
import { InviteeRow, MemberRow } from "@/components/trip/overview/overview-member";
import type { FriendState, Person } from "@/server/social/friends";
import type { PendingInvitee } from "@/server/trips/invites";
import type { TripMember } from "@/server/access";
import { inviteFriends } from "@/app/trip/[id]/overview/actions";

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
  return (
    <section id="the-group" data-tour="roster" className="flex min-w-0 scroll-mt-24 flex-wrap items-center gap-3">
      <h2 className="sr-only">Who&rsquo;s going</h2>
      <RosterSheet {...props} />
      <InviteSheet {...props} />
    </section>
  );
}

function RosterSheet({ tripId, viewerId, members, isAdmin, inviteUrl, friendStates, pendingInvitees, declinedInvitees, needDates }: Props) {
  const going = `${members.length} going`;
  const notes = goingNotes({
    toAddDates: members.filter((m) => needDates.has(m.userId)).length,
    invited: pendingInvitees.length,
  });
  return (
    <Sheet
      bareTrigger
      title={going}
      body="flush"
      triggerClassName="lift flex min-w-0 items-center gap-3 rounded-full py-1 pl-1 pr-3 text-left hover:bg-sheet-2 max-md:flex-[1_1_100%]"
      trigger={
        <>
          <AvatarRow people={members.map((m) => ({ name: m.name, avatarIcon: m.avatarIcon, tone: m.tone }))} max={5} size={32} />
          <span className="grid min-w-0 leading-tight">
            <span className="font-display text-base font-semibold text-ink">{going}</span>
            <span className="truncate text-sm text-ink-soft max-md:whitespace-normal">
              {goingNames(members.map((m) => m.name.split(" ")[0]))}
              {notes.length ? <span className="text-highlight-ink"> · {notes.join(" · ")}</span> : null}
            </span>
          </span>
        </>
      }
    >
      <div className="divide-y divide-rule">
        {members.map((m) => (
          <MemberRow
            key={m.userId}
            tripId={tripId}
            member={m}
            you={m.userId === viewerId}
            isAdmin={isAdmin}
            friendState={friendStates.get(m.userId) ?? "none"}
            needsDates={needDates.has(m.userId)}
          />
        ))}
        {pendingInvitees.map((p) => (
          <InviteeRow key={p.userId} person={p} word="Invited" />
        ))}
        {declinedInvitees.map((p) => (
          <InviteeRow key={p.userId} person={p} word="Declined" />
        ))}
      </div>
      <SheetFooter>
        <CopyLink value={inviteUrl} label="Copy invite link" icon={<LinkIcon />} />
      </SheetFooter>
    </Sheet>
  );
}

// Why: any member may invite, by name or by link (#312).
function InviteSheet({ tripId, members, pendingInvitees, friends, inviteUrl }: Props) {
  return (
    <Sheet
      trigger={
        <>
          <AddPersonIcon />
          Invite
        </>
      }
      title="Invite friends"
      triggerVariant="secondary"
    >
      {friends.length === 0 ? (
        <Stack gap={3}>
          <p className="text-sm text-ink-soft">You have no friends on Floc yet. Share the trip link instead.</p>
          <span>
            <CopyLink value={inviteUrl} label="Copy invite link" variant="primary" icon={<LinkIcon />} />
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
            <span className="flex flex-wrap justify-end gap-2">
              <CopyLink value={inviteUrl} label="Copy link" icon={<LinkIcon />} />
              <SubmitButton pendingLabel="Inviting…">Send invites</SubmitButton>
            </span>
          </Stack>
        </form>
      )}
    </Sheet>
  );
}

const iconProps = {
  viewBox: "0 0 14 14",
  width: 13,
  height: 13,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function AddPersonIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="5.4" cy="4.8" r="2" />
      <path d="M1.8 11.4c0-1.9 1.5-3 3.6-3s3.6 1.1 3.6 3M10.6 4.2v3.6M8.8 6h3.6" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg {...iconProps}>
      <path d="M6 8a2.4 2.4 0 0 0 3.4 0l1.8-1.8a2.4 2.4 0 0 0-3.4-3.4l-.7.7M8 6a2.4 2.4 0 0 0-3.4 0L2.8 7.8a2.4 2.4 0 0 0 3.4 3.4l.7-.7" />
    </svg>
  );
}
