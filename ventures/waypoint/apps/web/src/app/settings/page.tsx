/**
 * Settings (ticket 07, extended by 46; redesigned 201): the account half of
 * the two faces — your email, who can see your profile, notifications, data
 * handling and deleting the account. Anything you *curate* lives on /profile.
 *
 * Still no theme picker (the app is light-only), no locale, no timezone and no
 * consent-capture UI.
 */
import {
  deleteAccount,
  unlinkAccount,
  updateNotifications,
  updatePrivacy,
} from "./actions";
import type { Visibility } from "@/db/schema";
import { requireUser } from "@/server/access";
import { ensureProfile, listLinkedAccounts } from "@/server/profile";
import { AccountPage, PillChoice, Panel, PersonRow } from "@/components/account-ui";
import { Field, Input, Stack } from "@/components/ui";
import { ActionForm, ConfirmSubmit, SubmitButton } from "@/components/client-ui";

const NOTIFICATION_TOGGLES = [
  { name: "notifyInvites", label: "Trip invites" },
  { name: "notifyVotes", label: "New ideas & votes" },
  { name: "notifyMoney", label: "Costs added to a trip" },
  { name: "notifyNudges", label: "Nudges from other members" },
] as const;

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  facebook: "Facebook",
  credential: "Email & password",
};

/** Widest ring last, matching the nesting in lib/visibility.ts. */
const RING_LABELS: Record<Visibility, string> = {
  private: "Only me",
  friends: "Friends",
  trip_members: "Friends and people I've travelled with",
};

/** The same three pills under every attribute, in the same order each time. */
const RING_OPTIONS = (
  Object.entries(RING_LABELS) as [Visibility, string][]
).map(([value, label]) => ({ value, label }));

export default async function SettingsPage() {
  const viewer = await requireUser("/settings");
  const [profile, linkedAccounts] = await Promise.all([
    ensureProfile(viewer.id),
    listLinkedAccounts(viewer.id),
  ]);

  return (
    <AccountPage
      eyebrow="Your account"
      title="Settings"
      blurb="Your account, your privacy, and what Waypoint emails you about."
    >
      <Panel
        title="Account"
        hint="Your email comes from whichever provider signed you in, and can't be changed here."
      >
        <Stack gap={4}>
          <Field label="Email">
            <Input value={viewer.email} disabled readOnly />
          </Field>
          <div>
            <span className="typed mb-2 block">Sign-in methods</span>
            <ul className="flex flex-col gap-2">
              {linkedAccounts.map((a) => (
                <PersonRow key={a.id}>
                  <span className="text-sm">
                    {PROVIDER_LABELS[a.providerId] ?? a.providerId}
                  </span>
                  <ActionForm action={unlinkAccount}>
                    <input type="hidden" name="accountId" value={a.id} />
                    <SubmitButton
                      variant="ghost"
                      pendingLabel="Unlinking…"
                      className={linkedAccounts.length <= 1 ? "opacity-50" : undefined}
                    >
                      Unlink
                    </SubmitButton>
                  </ActionForm>
                </PersonRow>
              ))}
            </ul>
            <p className="mt-2 text-xs text-ink-faint">
              Unlinking your last remaining method is refused — you&rsquo;d lose access.
            </p>
          </div>
        </Stack>
      </Panel>

      <Panel
        title="Who can see your profile"
        hint="Nobody outside these rings can reach your profile at all — a stranger following the link gets nothing, the same as a made-up address."
      >
        <ActionForm action={updatePrivacy}>
          <Stack gap={4}>
            {/* The profile-wide override sits above the per-attribute rings,
                because when it's on they don't apply (ticket 46). */}
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="isPrivate"
                defaultChecked={profile.isPrivate}
                className="mt-0.5 size-4 rounded-sm border-rule-strong"
              />
              <span>
                Make my whole profile private
                <span className="block text-xs text-ink-faint">
                  People can still click your face — they&rsquo;ll see your name and
                  picture, and nothing else.
                </span>
              </span>
            </label>

            <PillChoice
              name="visibilityPicture"
              label="Profile picture"
              value={profile.visibilityPicture}
              options={RING_OPTIONS}
            />

            <PillChoice
              name="visibilityVibeTags"
              label="Vibe tags"
              value={profile.visibilityVibeTags}
              options={RING_OPTIONS}
            />

            <PillChoice
              name="visibilityTravelMap"
              label="Travel map"
              hint="Where you've been and where you want to go. Countries only — never a city, and never a date."
              value={profile.visibilityTravelMap}
              options={RING_OPTIONS}
            />

            <PillChoice
              name="visibilityFriends"
              label="Your friends list"
              hint="The only thing here that names other people, so it starts tighter than the rest. Anyone who's made their own profile private stays off it whatever you choose."
              value={profile.visibilityFriends}
              options={RING_OPTIONS}
            />

            <PillChoice
              name="pastTripsShow"
              label="Past trips"
              hint="Ended trips only, and they're hidden entirely while your profile is private."
              value={profile.pastTripsShow}
              options={[
                { value: "all", label: "All of them" },
                { value: "latest", label: "My most recent one only" },
              ]}
            />

            <p className="text-xs text-ink-faint">
              Dietary requirements have their own switch, on your profile — they
              never appear on a profile page, only where a trip needs them.
              Your home currency is always private.
            </p>

            <div>
              <SubmitButton variant="primary" pendingLabel="Saving…">
                Save privacy
              </SubmitButton>
            </div>
          </Stack>
        </ActionForm>
      </Panel>

      <Panel
        title="Email notifications"
        hint="Email only in v1 — no push. Invites you're asked for always send regardless of this."
      >
        <form action={updateNotifications}>
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
              <SubmitButton variant="primary" pendingLabel="Saving…">
                Save preferences
              </SubmitButton>
            </div>
          </Stack>
        </form>
      </Panel>

      <Panel title="Your data">
        <Stack gap={3}>
          <p className="text-sm text-ink-soft">
            There&rsquo;s no consent banner because there&rsquo;s nothing to consent to
            yet — Waypoint sends no marketing email and runs no analytics.
            The invite, nudge and money emails above are transactional
            (or toggled off above), not consent-based.
          </p>
          <p className="text-sm text-ink-soft">
            Want a copy of your data? Email{" "}
            <a
              href="mailto:support@waypoint.example"
              className="text-pen underline underline-offset-2 hover:text-pen-deep"
            >
              support@waypoint.example
            </a>{" "}
            — there&rsquo;s no self-serve export in v1.
          </p>
        </Stack>
      </Panel>

      <Panel
        title="Delete account"
        hint="Your trip content stays, attributed to “Deleted user.” Costs already logged stay on the ledger, frozen."
        className="bg-red-soft"
      >
        <form action={deleteAccount}>
          <ConfirmSubmit
            message="Delete your Waypoint account? Trips you're the sole admin of will hand admin to their earliest-joined remaining member. This can't be undone from the app."
            pendingLabel="Deleting…"
          >
            Delete my account
          </ConfirmSubmit>
        </form>
      </Panel>
    </AccountPage>
  );
}
