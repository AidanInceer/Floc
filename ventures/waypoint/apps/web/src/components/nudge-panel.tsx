/**
 * The Chase panel (ticket 05: a panel on Overview, not a route). Peer-to-peer
 * nudging — any member can nudge any other member, no admin gate, no
 * deadlines or escalation (ticket 01 step 6).
 */
import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { nudge, user, NUDGE_TABS } from "@/db/schema";
import type { TripMember } from "@/lib/access";
import { Avatar, Badge, Card, CardHeader, Field, Select, Stack, Textarea } from "@/components/ui";
import { Sheet, SubmitButton } from "@/components/client-ui";
import { sendNudge } from "@/app/trip/[id]/overview/actions";

const TAB_LABELS: Record<string, string> = {
  ideas: "Ideas",
  route: "Route",
  days: "Days",
  money: "Money",
};

export async function NudgePanel({
  tripId,
  viewerId,
  members,
}: {
  tripId: number;
  viewerId: string;
  members: TripMember[];
}) {
  const receivedRows = await db
    .select({
      id: nudge.id,
      tab: nudge.tab,
      message: nudge.message,
      createdAt: nudge.createdAt,
      fromName: user.name,
    })
    .from(nudge)
    .innerJoin(user, eq(user.id, nudge.fromUserId))
    .where(and(eq(nudge.tripId, tripId), eq(nudge.toUserId, viewerId), isNull(nudge.deletedAt)))
    .orderBy(desc(nudge.createdAt))
    .limit(5)
    .all();

  const others = members.filter((m) => m.userId !== viewerId);

  return (
    <Card>
      <CardHeader
        title="Chase"
        hint="Nudging is between the group, not the app — no deadlines, no auto-reminders."
      />
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <Stack gap={3}>
          <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-soft">
            Waiting on you
          </h3>
          {receivedRows.length === 0 ? (
            <p className="text-sm text-ink-faint">No one's nudged you here yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {receivedRows.map((n) => (
                <li key={n.id} className="rounded-sm border border-rule px-3 py-2 text-sm">
                  <p>
                    <span className="font-semibold">{n.fromName}</span> — waiting on{" "}
                    <Badge tone="open" className="normal-case">
                      {TAB_LABELS[n.tab] ?? n.tab}
                    </Badge>
                  </p>
                  {n.message ? (
                    <p className="mt-1 text-ink-soft">&ldquo;{n.message}&rdquo;</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Stack>

        <Stack gap={3}>
          <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-soft">
            Waiting on them
          </h3>
          {others.length === 0 ? (
            <p className="text-sm text-ink-faint">You're the only one here so far.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {others.map((m) => (
                <li
                  key={m.userId}
                  className="flex items-center justify-between gap-2 rounded-sm border border-rule px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Avatar name={m.name} src={m.avatarUrl} size={24} tone={m.tone} />
                    <span className="text-sm">{m.name}</span>
                  </div>
                  <Sheet trigger="Nudge" triggerVariant="secondary" title={`Nudge ${m.name}`}>
                    {/* action is a real Server Action ref, so it survives the
                       server→client boundary — a wrapping closure would not. */}
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
                </li>
              ))}
            </ul>
          )}
        </Stack>
      </div>
    </Card>
  );
}
