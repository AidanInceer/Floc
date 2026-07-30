/**
 * Settings (ticket 07): the four notification booleans only. No theme picker
 * (the app is light-only), no locale, no timezone, no consent-capture UI —
 * profile-ish fields (display name, avatar, home currency, vibe preferences)
 * live on /profile instead.
 */
import { updateNotifications, deleteAccount } from "./actions";
import { requireUser } from "@/lib/access";
import { ensureProfile } from "@/lib/profile";
import { Card, CardHeader, Page, PageHeader, Stack } from "@/components/ui";
import { ConfirmSubmit, SubmitButton } from "@/components/client-ui";

const NOTIFICATION_TOGGLES = [
  { name: "notifyInvites", label: "Trip invites" },
  { name: "notifyVotes", label: "New ideas & votes" },
  { name: "notifyMoney", label: "Costs added to a trip" },
  { name: "notifyNudges", label: "Nudges from other members" },
] as const;

export default async function SettingsPage() {
  const viewer = await requireUser("/settings");
  const profile = await ensureProfile(viewer.id);

  return (
    <Page>
      <PageHeader title="Settings" subtitle="Email notifications." />
      <Stack gap={6}>
        <Card>
          <CardHeader
            title="Email notifications"
            hint="Email only in v1 — no push. Invites you're asked for always send regardless of this."
          />
          <form action={updateNotifications} className="p-4">
            <Stack gap={3}>
              {NOTIFICATION_TOGGLES.map((t) => (
                <label key={t.name} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name={t.name}
                    defaultChecked={profile[t.name]}
                    className="size-4 rounded-sm border-rule-strong"
                  />
                  {t.label}
                </label>
              ))}
              <div>
                <SubmitButton pendingLabel="Saving…">Save preferences</SubmitButton>
              </div>
            </Stack>
          </form>
        </Card>

        <Card>
          <CardHeader title="Privacy & data" />
          <div className="p-4">
            <Stack gap={3}>
              <p className="text-sm text-ink-soft">
                There&rsquo;s no consent banner because there&rsquo;s nothing to consent to
                yet — Waypoint sends no marketing email and runs no analytics.
                The invite, nudge and money emails above are transactional
                (or toggled off above), not consent-based.
              </p>
              <p className="text-sm text-ink-soft">
                Want a copy of your data? Email{" "}
                <a href="mailto:support@waypoint.example" className="text-pen underline">
                  support@waypoint.example
                </a>{" "}
                — there&rsquo;s no self-serve export in v1.
              </p>
            </Stack>
          </div>
        </Card>

        <Card className="border-red/30">
          <CardHeader
            title="Delete account"
            hint="Your trip content stays, attributed to “Deleted user.” Costs already logged stay on the ledger, frozen."
          />
          <div className="p-4">
            <form action={deleteAccount}>
              <ConfirmSubmit
                message="Delete your Waypoint account? Trips you're the sole admin of will hand admin to their earliest-joined remaining member. This can't be undone from the app."
                pendingLabel="Deleting…"
              >
                Delete my account
              </ConfirmSubmit>
            </form>
          </div>
        </Card>
      </Stack>
    </Page>
  );
}
