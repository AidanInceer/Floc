import Link from "next/link";

import { Avatar, cx, menuDangerItemClass, menuItemClass } from "@/components/system/ui";
import { ConfirmSubmit, SubmitButton } from "@/components/system/client-ui";
import { FriendButton } from "@/components/social/friend-button";
import type { FriendState } from "@/server/social/friends";
import type { PendingInvitee } from "@/server/trips/invites";
import type { TripMember } from "@/server/access";
import { kickMember, promoteMember } from "@/app/trip/[id]/overview/actions";

const row = "flex min-h-[52px] items-center gap-3 px-4 py-2";
const word = "shrink-0 font-mono text-[11px] uppercase tracking-[0.06em]";

export function MemberRow({
  tripId,
  member: m,
  you,
  isAdmin,
  friendState,
  needsDates,
}: {
  tripId: number;
  member: TripMember;
  you: boolean;
  isAdmin: boolean;
  friendState: FriendState;
  needsDates: boolean;
}) {
  return (
    <details className="group open:bg-sheet-2">
      <summary className={cx(row, "cursor-pointer list-none hover:bg-sheet-2 [&::-webkit-details-marker]:hidden")}>
        <Avatar name={m.name} size={30} tone={m.tone} />
        <span className="min-w-0 flex-1 truncate text-sm text-ink">
          {m.name}
          {you ? <span className="text-ink-faint"> (you)</span> : null}
        </span>
        {needsDates ? (
          <span className="shrink-0 rounded-full bg-highlight-soft px-2 py-0.5 text-xs text-highlight-ink">Dates to add</span>
        ) : null}
        {m.role === "admin" ? <span className={cx(word, "text-pen-deep")}>Admin</span> : null}
        <Chevron />
      </summary>
      <div className="grid pb-2 pl-[54px] pr-4">
        <Link href={you ? "/profile" : `/profile/${m.userId}`} className={menuItemClass}>
          {you ? "Your profile" : "View profile"}
        </Link>
        {you ? null : (
          <>
            {friendState === "friends" ? null : (
              <div className="px-2.5 py-1.5">
                <FriendButton userId={m.userId} name={m.name} state={friendState} compact />
              </div>
            )}
            {isAdmin && m.role !== "admin" ? (
              <form action={promoteMember}>
                <input type="hidden" name="tripId" value={tripId} />
                <input type="hidden" name="userId" value={m.userId} />
                <SubmitButton variant="ghost" className={menuItemClass}>
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
                  className={menuDangerItemClass}
                >
                  Remove from trip
                </ConfirmSubmit>
              </form>
            ) : null}
          </>
        )}
      </div>
    </details>
  );
}

export function InviteeRow({ person, word: status }: { person: PendingInvitee; word: string }) {
  return (
    <div className={cx(row, "text-ink-faint")}>
      <span className="opacity-60">
        <Avatar name={person.name} size={30} />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm">{person.name}</span>
      <span className={word}>{status}</span>
      <span className="w-[13px] shrink-0" />
    </div>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 14 14" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-ink-faint transition-transform group-open:rotate-180">
      <path d="M4.2 5.6 7 8.4l2.8-2.8" />
    </svg>
  );
}
