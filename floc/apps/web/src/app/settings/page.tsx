/**
 * Settings (ticket 07, extended by 46; redesigned 201, split by section 235):
 * the account half of the two faces — your email, who can see your profile,
 * notifications, data handling and deleting the account. Anything you
 * *curate* lives on /profile.
 *
 * One section at a time, chosen from a rail (`?section=`, so a section is
 * linkable and the page needs no JavaScript). Delete sits at the far end of
 * the rail rather than at the foot of a long scroll — it can't be reached on
 * the way to anything else.
 *
 * Still no theme picker (the app is light-only), no locale, no timezone and no
 * consent-capture UI.
 */
import Link from "next/link";

import {
  deleteAccount,
  unlinkAccount,
  updateNotifications,
  updatePrivacy,
} from "./actions";
// Profile edits, but nothing you curate for other people to read — they belong
// with the rest of the switches rather than on the profile page (ticket 236).
import {
  updateCurrency,
  updateDietary,
  updatePacking,
  updateVibeTags,
} from "@/app/profile/actions";
import type { Subscription, Visibility } from "@/db/schema";
import { requireUser } from "@/server/access";
import { proPrices, subscriptionOf } from "@/server/billing";
import type { ProPrice } from "@/server/billing";
import { allFeaturesFree } from "@/lib/env";
import { ensureProfile, listLinkedAccounts } from "@/server/profile";
import { BillingAction, ProUpgrade } from "@/components/billing-buttons";
import { isLive, renewalLabel } from "@/lib/subscription-copy";
import {
  AccountPage,
  PillChoice,
  Panel,
  PersonRow,
  ToggleRow,
} from "@/components/account-ui";
import { Field, Input, Select, Stack, Textarea, cx } from "@/components/ui";
import {
  ActionForm,
  ConfirmSubmit,
  SubmitButton,
} from "@/components/client-ui";
import { VibePicker } from "@/components/vibe-picker";
import { DIET_FLAGS, MAX_DIETARY_NOTES, readDietFlags } from "@/lib/dietary";
import { PACK_TIERS, PACK_TIER_LABELS } from "@/lib/packing";
import { readVibeTags } from "@/lib/vibe-tags";

const SECTIONS = [
  { id: "privacy", label: "Privacy" },
  { id: "about-you", label: "About you" },
  { id: "trips", label: "Trips" },
  { id: "billing", label: "Billing" },
  { id: "email", label: "Email" },
  { id: "account", label: "Account" },
  { id: "data", label: "Your data" },
  { id: "delete", label: "Delete" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/**
 * The panel to draw. With Pro switched off there is no Billing panel, so an
 * old link or a stale checkout return falls back to the first section rather
 * than rendering nothing.
 */
function sectionFor(asked: string | undefined): SectionId {
  const found = SECTIONS.find((s) => s.id === asked)?.id;
  if (!found) return "privacy";
  return found === "billing" && allFeaturesFree() ? "privacy" : found;
}

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
  trip_members: "Friends and travelled with",
};

/** The same three pills under every attribute, in the same order each time. */
const RING_OPTIONS = (
  Object.entries(RING_LABELS) as [Visibility, string][]
).map(([value, label]) => ({ value, label }));

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; billing?: string }>;
}) {
  const { section, billing } = await searchParams;
  // Carry the section through the login round trip, so "Upgrade now" from the
  // home page lands on Billing rather than on Privacy.
  const viewer = await requireUser(
    section ? `/settings?section=${section}` : "/settings",
  );
  // Checkout returns to `?billing=done`, so land on the panel that shows it.
  const asked = section ?? (billing ? "billing" : undefined);
  const current = sectionFor(asked);

  const [profile, linkedAccounts, subscription, prices] = await Promise.all([
    ensureProfile(viewer.id),
    listLinkedAccounts(viewer.id),
    subscriptionOf(viewer.id),
    // Someone sent here by a locked feature arrived to find out the cost
    // (ticket 279), so the panel quotes it rather than naming the plan.
    allFeaturesFree() ? Promise.resolve<ProPrice[]>([]) : proPrices(),
  ]);

  const vibeTags = readVibeTags(profile.vibeTags);
  const dietFlags = readDietFlags(profile.dietFlags);

  return (
    <AccountPage title="Settings">
      <div className="grid gap-4 sm:grid-cols-[max-content_minmax(0,1fr)] sm:items-start">
        <SectionRail current={current} />

        <div className="min-w-0">
          {current === "privacy" ? (
            <Panel title="Who can see your profile">
              <ActionForm action={updatePrivacy}>
                <Stack gap={4}>
                  {/* The profile-wide override sits above the per-attribute
                      rings, because when it's on they don't apply (ticket 46). */}
                  <ToggleRow
                    name="isPrivate"
                    label="Make my whole profile private"
                    hint="People can still click your face — they'll see your name and picture, and nothing else."
                    defaultChecked={profile.isPrivate}
                  />

                  <hr className="border-rule" />

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
                    value={profile.visibilityTravelMap}
                    options={RING_OPTIONS}
                  />

                  <PillChoice
                    name="visibilityFriends"
                    label="Your friends list"
                    hint="Anyone who's made their own profile private stays off it whatever you choose."
                    value={profile.visibilityFriends}
                    options={RING_OPTIONS}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <PillChoice
                      className="flex-1"
                      name="pastTripsShow"
                      label="Past trips"
                      value={profile.pastTripsShow}
                      options={[
                        { value: "all", label: "All of them" },
                        { value: "latest", label: "Most recent only" },
                      ]}
                    />
                    <SubmitButton variant="primary" pendingLabel="Saving…">
                      Save privacy
                    </SubmitButton>
                  </div>
                </Stack>
              </ActionForm>
            </Panel>
          ) : null}

          {current === "about-you" ? (
            <Stack gap={4}>
              <Panel title="Vibe tags">
                <ActionForm action={updateVibeTags}>
                  <Stack gap={4}>
                    <VibePicker selected={vibeTags} />
                    <div>
                      <SubmitButton variant="primary" pendingLabel="Saving…">
                        Save vibe tags
                      </SubmitButton>
                    </div>
                  </Stack>
                </ActionForm>
              </Panel>

              <Panel
                title="Dietary"
                hint="Never shown on your profile page — this surfaces where it does work, on a trip deciding where to eat."
              >
                <ActionForm action={updateDietary}>
                  <Stack gap={4}>
                    <div>
                      <span className="typed mb-3 block">Diets</span>
                      <Stack gap={3}>
                        {Object.entries(DIET_FLAGS).map(([value, label]) => (
                          <ToggleRow
                            key={value}
                            name="dietFlag"
                            value={value}
                            label={label}
                            defaultChecked={dietFlags.includes(value as never)}
                          />
                        ))}
                      </Stack>
                    </div>
                    <Field label="Allergies and intolerances">
                      <Textarea
                        name="dietaryNotes"
                        defaultValue={profile.dietaryNotes ?? ""}
                        maxLength={MAX_DIETARY_NOTES}
                      />
                    </Field>
                    {/* One switch for the whole record — you can't publish half
                        a dietary record (ticket 46). */}
                    <ToggleRow
                      name="shareDietary"
                      label="Share this with people I'm on a trip with"
                      hint="All of it or none of it — the diets and the free text move together."
                      defaultChecked={profile.shareDietary}
                    />
                    <div>
                      <SubmitButton variant="primary" pendingLabel="Saving…">
                        Save dietary
                      </SubmitButton>
                    </div>
                  </Stack>
                </ActionForm>
              </Panel>
            </Stack>
          ) : null}

          {current === "trips" ? (
            <Stack gap={4}>
              <Panel
                title="Packing"
                hint="Where a new trip starts. Choosing a different style on one trip stays on that trip."
              >
                <ActionForm action={updatePacking}>
                  <Stack gap={4}>
                    <PillChoice
                      name="packTier"
                      label="How much you pack"
                      hint="Scales how many of each thing a generated list suggests — never what kinds of thing."
                      value={profile.packTier}
                      options={PACK_TIERS.map((t) => ({
                        value: t,
                        label: PACK_TIER_LABELS[t],
                      }))}
                    />
                    <ToggleRow
                      name="packAutoGenerate"
                      label="Fill my bag in when I open a trip's packing"
                      hint="Off means the list stays empty until you ask for one."
                      defaultChecked={profile.packAutoGenerate}
                    />
                    <div>
                      <SubmitButton variant="primary" pendingLabel="Saving…">
                        Save packing
                      </SubmitButton>
                    </div>
                  </Stack>
                </ActionForm>
              </Panel>

              <Panel
                title="Home currency"
                hint="Defaults the currency picker in Money. Never shown on your profile."
              >
                <ActionForm action={updateCurrency}>
                  <Stack gap={4}>
                    <Field label="Currency">
                      <Select
                        name="homeCurrency"
                        defaultValue={profile.homeCurrency}
                      >
                        <option value="GBP">GBP — £</option>
                        <option value="EUR">EUR — €</option>
                        <option value="USD">USD — $</option>
                      </Select>
                    </Field>
                    <div>
                      <SubmitButton variant="primary" pendingLabel="Saving…">
                        Save
                      </SubmitButton>
                    </div>
                  </Stack>
                </ActionForm>
              </Panel>
            </Stack>
          ) : null}

          {current === "billing" && !allFeaturesFree() ? (
            <BillingPanel
              subscription={subscription}
              billing={billing}
              prices={prices}
            />
          ) : null}

          {current === "email" ? (
            <Panel
              title="Email notifications"
              hint="Invites you're asked for always send regardless of this."
            >
              <form action={updateNotifications}>
                <Stack gap={3}>
                  {NOTIFICATION_TOGGLES.map((t) => (
                    <ToggleRow
                      key={t.name}
                      name={t.name}
                      label={t.label}
                      defaultChecked={profile[t.name]}
                    />
                  ))}
                  <div>
                    <SubmitButton variant="primary" pendingLabel="Saving…">
                      Save preferences
                    </SubmitButton>
                  </div>
                </Stack>
              </form>
            </Panel>
          ) : null}

          {current === "account" ? (
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
                  <ul className="flex flex-col divide-y divide-rule border-y border-rule">
                    {linkedAccounts.map((a) => (
                      <PersonRow
                        key={a.id}
                        className="rounded-none bg-transparent px-0"
                      >
                        <span className="text-sm">
                          {PROVIDER_LABELS[a.providerId] ?? a.providerId}
                        </span>
                        <ActionForm action={unlinkAccount}>
                          <input type="hidden" name="accountId" value={a.id} />
                          <SubmitButton
                            variant="ghost"
                            pendingLabel="Unlinking…"
                            className={
                              linkedAccounts.length <= 1
                                ? "opacity-50"
                                : undefined
                            }
                          >
                            Unlink
                          </SubmitButton>
                        </ActionForm>
                      </PersonRow>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-ink-faint">
                    Unlinking your last remaining method is refused —
                    you&rsquo;d lose access.
                  </p>
                </div>
              </Stack>
            </Panel>
          ) : null}

          {current === "data" ? (
            <Panel title="Your data">
              <Stack gap={3}>
                <p className="text-sm text-ink-soft">
                  There&rsquo;s no consent banner because there&rsquo;s nothing
                  to consent to yet — Floc sends no marketing email and runs
                  no analytics. The invite, nudge and money emails are
                  transactional, not consent-based.
                </p>
                <p className="text-sm text-ink-soft">
                  Want a copy of your data? Email{" "}
                  <a
                    href="mailto:support@floc.example"
                    className="text-pen underline underline-offset-2 hover:text-pen-deep"
                  >
                    support@floc.example
                  </a>{" "}
                  — there&rsquo;s no self-serve export in v1.
                </p>
              </Stack>
            </Panel>
          ) : null}

          {current === "delete" ? (
            <Panel
              title="Delete account"
              hint="Your trip content stays, attributed to “Deleted user.” Costs already logged stay on the ledger, frozen."
              className="bg-red-soft"
            >
              <form action={deleteAccount}>
                <ConfirmSubmit
                  message="Delete your Floc account? Trips you're the sole admin of will hand admin to their earliest-joined remaining member. This can't be undone from the app."
                  pendingLabel="Deleting…"
                >
                  Delete my account
                </ConfirmSubmit>
              </form>
            </Panel>
          ) : null}
        </div>
      </div>
    </AccountPage>
  );
}

/**
 * Plain links, so a section is bookmarkable and works without JavaScript. The
 * track's radius is the pill's own plus its 4px padding — `rounded-full` reads
 * as an oval once the rail stacks (ticket 235).
 */
function SectionRail({ current }: { current: SectionId }) {
  return (
    <nav
      aria-label="Settings sections"
      className="scroll-x-bare flex flex-row items-center gap-1 rounded-full bg-sheet-3 p-1 sm:flex-col sm:items-stretch sm:overflow-visible sm:rounded-[1.3125rem]"
    >
      {SECTIONS.filter((s) => s.id !== "billing" || !allFeaturesFree()).map(
        (s) => {
          const active = s.id === current;
          const danger = s.id === "delete";
          return (
            <Link
              key={s.id}
              href={`/settings?section=${s.id}`}
              aria-current={active ? "page" : undefined}
              className={cx(
                "shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors sm:text-left",
                active && danger
                  ? "bg-red text-sheet"
                  : active
                    ? "bg-ink text-sheet"
                    : danger
                      ? "text-red hover:bg-red-soft hover:text-red"
                      : "text-ink-soft hover:bg-sheet hover:text-ink",
              )}
            >
              {s.label}
            </Link>
          );
        },
      )}
    </nav>
  );
}

/**
 * Plan, date, and the one link out (ticket 247). Split from the page body
 * because the panel branches three ways — comped, paying, and neither.
 */
function BillingPanel({
  subscription,
  billing,
  prices,
}: {
  subscription: Subscription | null;
  billing?: string;
  prices: ProPrice[];
}) {
  return (
    <Panel
      title="Floc Pro"
      hint="Pro covers everyone on a trip you're in — one of you paying is enough."
    >
      <Stack gap={4}>
        {billing === "cancelled" ? (
          <p className="text-sm text-ink-soft">
            No payment was taken — you closed the checkout.
          </p>
        ) : null}

        {subscription && isLive(subscription) ? (
          <Stack gap={4}>
            <p className="text-sm font-medium">You&rsquo;re on Pro.</p>
            {subscription.stripeCustomerId ? (
              /* Date and the way out on one line — the button is what
                       the date is for, so it does not need its own row. */
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <p className="text-sm text-ink-soft">
                  {renewalLabel(subscription)}
                </p>
                <BillingAction path="/api/billing/portal">
                  Manage or cancel
                </BillingAction>
              </div>
            ) : (
              <div>
                <p className="text-sm text-ink-soft">
                  {renewalLabel(subscription)}
                </p>
                <p className="mt-1 text-sm text-ink-faint">
                  This one was granted rather than bought, so there is nothing
                  to bill or cancel.
                </p>
              </div>
            )}
          </Stack>
        ) : (
          <Stack gap={4}>
            <p className="text-sm text-ink-soft">
              {subscription
                ? renewalLabel(subscription)
                : "You’re on the free plan."}{" "}
              Pro adds the weather forecast on your dates and a packing list
              filled in for you.
            </p>
            <ProUpgrade prices={prices} canBuy href="/settings?section=billing" />
          </Stack>
        )}
      </Stack>
    </Panel>
  );
}
