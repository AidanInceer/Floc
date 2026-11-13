/**
 * Settings (ticket 07, redesigned 201, split by section 235, rows in place F3c):
 * the account half of the two faces. Anything you *curate* lives on /profile.
 * Four sheets of rows that open in place, several at once, like the phone's
 * drawers. `?section=` opens one, so a link or a checkout return lands on it.
 */
import { deleteAccount, removeGoogleCalendar, unlinkAccount, updateNotifications, updatePrivacy } from "./actions";
import { updateVibeTags } from "@/app/profile/actions";
import { requireUser } from "@/server/access";
import { proPrices, subscriptionOf } from "@/server/billing/billing";
import type { ProPrice } from "@/server/billing/billing";
import { allFeaturesFree } from "@/lib/env";
import { ensureProfile } from "@/server/auth/profile";
import { hasCalendarAccess } from "@/server/calendar/calendar-import";
import { GoogleCalendarIcon } from "@/components/system/icons/google-calendar";
import { listSignInMethods } from "@/server/auth/sign-in-methods";
import { isLive, renewalLabel } from "@floc/core/billing/subscription-copy";
import { AccountPage, ToggleRow } from "@/components/auth/account-ui";
import { ActionForm, ConfirmSubmit, SubmitButton } from "@/components/system/client-ui";
import { AccountTabs } from "@/components/chrome/account-tabs";
import { AutoSaveForm } from "@/components/settings/auto-save-form";
import { PrivacyLines } from "@/components/settings/privacy-lines";
import { ProCompare } from "@/components/settings/pro-compare";
import { ProStatus } from "@/components/settings/pro-status";
import { SettingsRow, SettingsSheet } from "@/components/settings/settings-row";
import { TravelStyle } from "@/components/settings/travel-style";
import { TripsFields } from "@/components/settings/trips-fields";
import { PACK_TIER_LABELS } from "@floc/core/packing/packing";
import { notificationSummary, privacySummary, travelStyleSummary, tripsSummary } from "@floc/core/people/settings-summary";
import { readVibeTags } from "@floc/core/trip/vibe-tags";

const SECTIONS = ["privacy", "about-you", "trips", "billing", "notifications", "account", "data", "delete"] as const;
type SectionId = (typeof SECTIONS)[number];

/** With Pro switched off there is no Pro row, so an old billing link opens Privacy rather than nothing. */
function sectionFor(asked: string | undefined): SectionId {
  const found = SECTIONS.find((s) => s === asked);
  if (!found) return "privacy";
  return found === "billing" && allFeaturesFree() ? "privacy" : found;
}

const NOTIFICATION_TOGGLES = [
  { name: "notifyPush", label: "Push", hint: "On any phone signed in to Floc." },
  { name: "notifyEmail", label: "Email", hint: "Only when push can't reach you." },
  { name: "notifyReminders", label: "Reminders", hint: "A week before a trip, on the day, and money still owed after." },
] as const;

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  facebook: "Facebook",
  credential: "Email & password",
};

const accountLineClass = "flex flex-wrap items-center justify-between gap-3 py-2.5";

const DELETE_WARNING =
  "Delete your Floc account? Trips you're the sole admin of will hand admin to their earliest-joined remaining member. This can't be undone from the app.";

export const metadata = { title: "Settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; billing?: string }>;
}) {
  const { section, billing } = await searchParams;
  // Carry the section through the login round trip, so "Upgrade now" lands on Pro.
  const viewer = await requireUser(section ? `/settings?section=${section}` : "/settings");
  // Checkout returns to `?billing=done`, so open the row that shows it.
  const opened = sectionFor(section ?? (billing ? "billing" : undefined));

  const [profile, linkedAccounts, calendarGranted, subscription, prices] = await Promise.all([
    ensureProfile(viewer.id),
    listSignInMethods(viewer.id),
    hasCalendarAccess(viewer.id),
    subscriptionOf(viewer.id),
    allFeaturesFree() ? Promise.resolve<ProPrice[]>([]) : proPrices(),
  ]);

  const vibeTags = readVibeTags(profile.vibeTags);
  const row = (id: SectionId) => ({ id: `settings-${id}`, open: opened === id });

  return (
    <>
      <AccountTabs current="settings" />
      <AccountPage title="Settings" titleInBar>
        <div className="mx-auto flex w-full max-w-[40rem] flex-col gap-3">
          <SettingsSheet>
            <SettingsRow
              {...row("privacy")}
              title="Privacy"
              summary={privacySummary({
                isPrivate: profile.isPrivate,
                rings: [
                  profile.visibilityVibeTags,
                  profile.visibilityTravelMap,
                  profile.visibilityFriends,
                  profile.visibilitySaved,
                ],
              })}
            >
              <AutoSaveForm action={updatePrivacy} className="flex flex-col gap-5">
                <PrivacyLines
                  isPrivate={profile.isPrivate}
                  rings={{
                    visibilityVibeTags: profile.visibilityVibeTags,
                    visibilityTravelMap: profile.visibilityTravelMap,
                    visibilityFriends: profile.visibilityFriends,
                    visibilitySaved: profile.visibilitySaved,
                  }}
                  pastTripsLatest={profile.pastTripsShow === "latest"}
                />
              </AutoSaveForm>
            </SettingsRow>

            <SettingsRow {...row("about-you")} title="Your travel style" summary={travelStyleSummary(vibeTags)}>
              <AutoSaveForm action={updateVibeTags} className="flex flex-col gap-3">
                <TravelStyle selected={vibeTags} />
                <p className="text-xs text-ink-faint">Shown on your profile to the people you pick in Privacy.</p>
              </AutoSaveForm>
            </SettingsRow>

            <SettingsRow
              {...row("trips")}
              title="Trips"
              summary={tripsSummary(PACK_TIER_LABELS[profile.packTier], profile.homeCurrency)}
            >
              <TripsFields
                packTier={profile.packTier}
                packAutoGenerate={profile.packAutoGenerate}
                homeCurrency={profile.homeCurrency}
              />
            </SettingsRow>
          </SettingsSheet>

          {allFeaturesFree() ? null : (
            <SettingsSheet>
              <ProRow {...row("billing")} subscription={subscription} prices={prices} billing={billing} />
            </SettingsSheet>
          )}

          <SettingsSheet>
            <SettingsRow
              {...row("notifications")}
              title="Notifications"
              summary={notificationSummary({
                push: profile.notifyPush,
                email: profile.notifyEmail,
                reminders: profile.notifyReminders,
              })}
            >
              <AutoSaveForm action={updateNotifications} className="flex flex-col gap-4">
                {NOTIFICATION_TOGGLES.map((t) => (
                  <ToggleRow key={t.name} name={t.name} label={t.label} hint={t.hint} defaultChecked={profile[t.name]} />
                ))}
              </AutoSaveForm>
            </SettingsRow>

            <SettingsRow {...row("account")} title="Account" summary={viewer.email}>
              <div className="mx-auto flex w-full max-w-80 flex-col items-center gap-1.5">
                <span className="text-sm">Email</span>
                <p className="w-full truncate rounded-sm bg-sheet-2 px-3 py-2 text-center font-mono text-[13px] text-ink-soft">
                  {viewer.email}
                </p>
              </div>
              <ul className="flex flex-col divide-y divide-rule">
                {linkedAccounts.map((a) => (
                  <li key={a.id} className={accountLineClass}>
                    <span className="text-sm">{PROVIDER_LABELS[a.providerId] ?? a.providerId}</span>
                    <ActionForm action={unlinkAccount}>
                      <input type="hidden" name="accountId" value={a.id} />
                      <SubmitButton variant="ghost" disabled={linkedAccounts.length <= 1}>
                        Unlink
                      </SubmitButton>
                    </ActionForm>
                  </li>
                ))}
                {calendarGranted ? (
                  <li className={accountLineClass}>
                    <span className="inline-flex items-center gap-2 text-sm">
                      <GoogleCalendarIcon size={18} />
                      Google Calendar
                      <span className="text-xs text-ink-faint">Reads when you&rsquo;re busy</span>
                    </span>
                    <ActionForm action={removeGoogleCalendar}>
                      <SubmitButton variant="ghost">Remove</SubmitButton>
                    </ActionForm>
                  </li>
                ) : null}
              </ul>
              {linkedAccounts.length <= 1 ? (
                <p className="-mt-3 text-xs text-ink-faint">Unlinking your only sign-in is refused, so you keep access.</p>
              ) : null}
            </SettingsRow>

            <SettingsRow {...row("data")} title="Your data" summary="No analytics, no marketing email">
              <p className="max-w-[62ch] text-sm text-ink-soft">
                Floc sends no marketing email and runs no analytics. Notification emails are about your own trips.
              </p>
            </SettingsRow>
          </SettingsSheet>

          <SettingsSheet>
            <SettingsRow {...row("delete")} title="Delete" danger>
              <form action={deleteAccount} className="flex flex-col items-center gap-3.5 text-center">
                <p className="max-w-[62ch] text-sm text-ink-soft">
                  Your trip content stays, under &ldquo;Deleted user&rdquo;. Costs already logged stay on the ledger.
                </p>
                <ConfirmSubmit message={DELETE_WARNING}>Delete my account</ConfirmSubmit>
              </form>
            </SettingsRow>
          </SettingsSheet>
        </div>
      </AccountPage>
    </>
  );
}

function ProRow({
  id,
  open,
  subscription,
  prices,
  billing,
}: {
  id: string;
  open: boolean;
  subscription: Awaited<ReturnType<typeof subscriptionOf>>;
  prices: ProPrice[];
  billing?: string;
}) {
  const onPro = subscription !== null && isLive(subscription);
  return (
    <SettingsRow
      id={id}
      open={open}
      title="Floc Pro"
      summary={onPro ? `Pro, ${renewalLabel(subscription).toLowerCase()}` : "Free"}
      aside={onPro ? null : <span className="rounded-sm border border-ink px-2.5 py-0.5 text-[13px] font-semibold">Get Pro</span>}
    >
      {billing === "cancelled" ? (
        <p className="text-sm text-ink-soft">No payment was taken — you closed the checkout.</p>
      ) : null}
      {onPro ? (
        <ProStatus subscription={subscription} />
      ) : (
        <>
          {subscription ? <p className="text-sm text-ink-soft">{renewalLabel(subscription)}</p> : null}
          <ProCompare prices={prices} />
        </>
      )}
    </SettingsRow>
  );
}
