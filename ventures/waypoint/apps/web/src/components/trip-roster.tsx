/**
 * "Who's going" — the right half of the Overview hero (v0.2 ticket 07).
 * Replaces the Chase panel, which was two columns of nudge targets sitting a
 * screen below an Unresolved list built from the same three checks.
 *
 * The roster owns chasing now, because chasing is a thing you do *to someone*:
 * every member gets a bell on their row, and Unresolved just says what is
 * outstanding. Neither says the other's half.
 *
 * Nudging is still peer-to-peer with no deadlines and no escalation (v1
 * ticket 05), and the nudge itself is delivered by email in `sendNudge` — so
 * dropping the old "waiting on you" list doesn't leave nudges undeliverable.
 */
import { Avatar, Badge } from "@/components/ui";
import { Field, Select, Stack, Textarea } from "@/components/ui";
import { CopyLink, Sheet, SubmitButton } from "@/components/client-ui";
import { NUDGE_TABS } from "@/db/schema";
import type { TripMember } from "@/lib/access";
import { sendNudge } from "@/app/trip/[id]/overview/actions";

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
}: {
  tripId: number;
  viewerId: string;
  members: TripMember[];
  isAdmin: boolean;
  /** Absent for a non-admin — inviting is one of the four admin powers. */
  inviteUrl?: string;
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
          <CopyLink value={inviteUrl} label="Share trip" variant="primary" icon={<ShareIcon />} />
        ) : null}
      </div>

      <ul className="mt-1">
        {members.map((m) => (
          <li
            key={m.userId}
            className="flex items-center gap-2 border-b border-dotted border-rule-strong py-1.5 last:border-b-0"
          >
            <span className="flex min-w-0 flex-1 items-center gap-2 text-sm">
              <Avatar name={m.name} src={m.avatarUrl} size={26} tone={m.tone} />
              <span className="truncate">{m.name}</span>
              {m.userId === viewerId ? (
                <span className="text-xs text-ink-faint">(you)</span>
              ) : null}
              {m.role === "admin" ? <Badge tone="marine">Admin</Badge> : null}
            </span>

            {/* No bell on your own row — you can't chase yourself. */}
            {m.userId !== viewerId ? (
              <Sheet
                trigger={<BellIcon />}
                triggerVariant="ghost"
                triggerLabel={`Nudge ${m.name}`}
                triggerClassName="!h-[26px] !w-[26px] !rounded-full !border-transparent !px-0 !py-0 !text-ink-faint hover:!border-rule-strong hover:!bg-sheet hover:!text-pen"
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
            ) : (
              // Keeps every name on the same left edge whether or not the row
              // ends in a bell.
              <span aria-hidden="true" className="h-[26px] w-[26px]" />
            )}
          </li>
        ))}
      </ul>

      {isAdmin && members.length === 1 ? (
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

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
      <path d="M10.3 20a2 2 0 0 0 3.4 0" />
    </svg>
  );
}
