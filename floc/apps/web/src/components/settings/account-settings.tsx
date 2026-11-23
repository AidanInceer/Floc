import { deleteAccount, removeGoogleCalendar, unlinkAccount, updateNotifications, updatePrivacy } from "@/app/settings/actions";
import { updateVibeTags } from "@/app/profile/actions";
import type { ProPrice, subscriptionOf } from "@/server/billing/billing";
import type { ensureProfile } from "@/server/auth/profile";
import type { listSignInMethods } from "@/server/auth/sign-in-methods";
import { GoogleCalendarIcon } from "@/components/system/icons/google-calendar";
import { isLive, renewalLabel } from "@floc/core/billing/subscription-copy";
import { ToggleRow } from "@/components/auth/account-ui";
import { DataRow } from "@/components/settings/data-row";
import type { ConsentChoice } from "@floc/core/consent/consent";
import { ActionForm, ConfirmSubmit, SubmitButton } from "@/components/system/client-ui";
import { AutoSaveForm } from "@/components/settings/auto-save-form";
import { PrivacyLines } from "@/components/settings/privacy-lines";
import { ProCompare } from "@/components/settings/pro-compare";
import { ProStatus } from "@/components/settings/pro-status";
import { SettingsRow, SettingsSheet } from "@/components/settings/settings-row";
import { TravelStyle } from "@/components/settings/travel-style";
import { TripsFields } from "@/components/settings/trips-fields";
import { MotionField } from "@/components/settings/motion-field";
import { EstimateRow } from "@/components/settings/estimate-fields";
import type { EstimateSettings } from "@floc/core/money/estimate/view";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { PACK_TIER_LABELS } from "@floc/core/packing/packing";
import { notificationSummary, privacySummary, travelStyleSummary, tripsSummary } from "@floc/core/people/settings-summary";
import { readVibeTags } from "@floc/core/trip/vibe-tags";
import type { SettingsSection } from "@/lib/settings/settings-section";

const NOTIFICATION_TOGGLES = [
  { name: "notifyPush", label: "Push", hint: "On any phone signed in to Floc." },
  { name: "notifyEmail", label: "Email", hint: "Only when push can't reach you." },
  { name: "notifyReminders", label: "Reminders", hint: "A week before a trip, on the day, and money still owed a week and a month after." },
  { name: "notifyNextTrip", label: "Next trip ideas", hint: "Two and six months after your last trip, if nothing's planned." },
] as const;

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  facebook: "Facebook",
  credential: "Email & password",
};

const accountLineClass = "flex flex-wrap items-center justify-between gap-3 py-2.5";
const signOutClass = "-mr-2.5 inline-flex h-[31px] items-center gap-1.5 rounded-sm px-2.5 text-[13px] text-ink-soft hover:bg-pen-soft hover:text-pen-deep";

const DELETE_WARNING =
  "Delete your Floc account? Trips you're the sole admin of will hand admin to their earliest-joined remaining member. Your trip content stays, under 'Deleted user', and costs already logged stay on the ledger. This can't be undone from the app.";

type Subscription = Awaited<ReturnType<typeof subscriptionOf>>;

export type AccountSettingsProps = {
  email: string;
  profile: Awaited<ReturnType<typeof ensureProfile>>;
  linkedAccounts: Awaited<ReturnType<typeof listSignInMethods>>;
  calendarGranted: boolean;
  pro: { subscription: Subscription; prices: ProPrice[] } | null;
  opened: SettingsSection | null;
  billing?: string;
  estimate: EstimateSettings;
  consent: ConsentChoice | null;
};

export function AccountSettings({ email, profile, linkedAccounts, calendarGranted, pro, opened, billing, estimate, consent }: AccountSettingsProps) {
  const vibeTags = readVibeTags(profile.vibeTags);
  const row = (id: SettingsSection) => ({ id: `settings-${id}`, open: opened === id });

  return (
    <>
      <SettingsSheet>
        <SettingsRow {...row("account")} title="Account" summary={email}>
          <div className="mx-auto flex w-full max-w-80 flex-col items-center gap-1.5">
            <span className="text-sm">Email</span>
            <p className="w-full truncate rounded-sm bg-sheet-2 px-3 py-2 text-center font-mono text-[13px] text-ink-soft">{email}</p>
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

        {pro ? <ProRow {...row("billing")} subscription={pro.subscription} prices={pro.prices} billing={billing} /> : null}

        <SettingsRow
          {...row("privacy")}
          title="Privacy"
          summary={privacySummary({
            isPrivate: profile.isPrivate,
            rings: [profile.visibilityVibeTags, profile.visibilityTravelMap, profile.visibilityFriends, profile.visibilitySaved],
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
              styleInGroupIdeas={profile.styleInGroupIdeas}
            />
          </AutoSaveForm>
        </SettingsRow>

        <SettingsRow
          {...row("notifications")}
          title="Notifications"
          summary={notificationSummary({
            push: profile.notifyPush,
            email: profile.notifyEmail,
            reminders: profile.notifyReminders,
            nextTrip: profile.notifyNextTrip,
          })}
        >
          <AutoSaveForm action={updateNotifications} className="flex flex-col gap-4">
            {NOTIFICATION_TOGGLES.map((t) => (
              <ToggleRow key={t.name} name={t.name} label={t.label} hint={t.hint} defaultChecked={profile[t.name]} />
            ))}
          </AutoSaveForm>
        </SettingsRow>

        <DataRow {...row("data")} consent={consent} advertisingEmail={Boolean(profile.marketingEmailConsentAt)} />
      </SettingsSheet>

      <SettingsSheet>
        <SettingsRow {...row("about-you")} title="Your travel style" summary={travelStyleSummary(vibeTags)}>
          <AutoSaveForm action={updateVibeTags} className="flex flex-col gap-3">
            <TravelStyle selected={vibeTags} />
            <p className="text-xs text-ink-faint">Shown on your profile to the people you pick in Privacy.</p>
          </AutoSaveForm>
        </SettingsRow>

        <SettingsRow {...row("motion")} title="Animations" summary={profile.reduceMotion ? "Off" : "On"}>
          <MotionField reduceMotion={profile.reduceMotion} />
        </SettingsRow>

        <SettingsRow {...row("trips")} title="Trips" summary={tripsSummary(PACK_TIER_LABELS[profile.packTier], profile.homeCurrency)}>
          <TripsFields packTier={profile.packTier} homeCurrency={profile.homeCurrency} />
        </SettingsRow>

        <EstimateRow {...row("estimate")} settings={estimate} />
      </SettingsSheet>

      <SettingsSheet>
        <div className="flex items-center justify-between gap-3 px-[18px] py-3">
          <form action={deleteAccount}>
            <ConfirmSubmit message={DELETE_WARNING} confirmLabel="Delete my account">Delete account</ConfirmSubmit>
          </form>
          <SignOutButton className={signOutClass} />
        </div>
      </SettingsSheet>
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
  subscription: Subscription;
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
      {billing === "cancelled" ? <p className="text-sm text-ink-soft">No payment was taken — you closed the checkout.</p> : null}
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
