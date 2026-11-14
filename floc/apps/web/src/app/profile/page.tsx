/**
 * Your own profile (ticket 46; redesigned 201, reordered 236): your face as a
 * visitor sees it, then your settings under it. Your name and picture are edited
 * from the card itself; everything else is a row that opens in place.
 * `?section=` opens one row, so a link or a checkout return lands on it.
 */
import { requireUser } from "@/server/access";
import { ensureProfile } from "@/server/auth/profile";
import { listSignInMethods } from "@/server/auth/sign-in-methods";
import { hasCalendarAccess } from "@/server/calendar/calendar-import";
import { proPrices, subscriptionOf } from "@/server/billing/billing";
import { allFeaturesFree } from "@/lib/env";
import { settingsSectionFor } from "@/lib/settings/settings-section";
import { readVibeTags } from "@floc/core/trip/vibe-tags";
import { AccountPage, Panel } from "@/components/auth/account-ui";
import { Badge } from "@/components/system/ui";
import { FaceEditor } from "@/components/profile/face-editor";
import { AccountTabs } from "@/components/chrome/account-tabs";
import { AccountSettings } from "@/components/settings/account-settings";

export const metadata = { title: "Your profile" };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; billing?: string }>;
}) {
  const asked = await searchParams;
  // Carry the section through the login round trip, so "Upgrade now" lands on Pro.
  const viewer = await requireUser(asked.section ? `/profile?section=${asked.section}` : "/profile");
  const proOff = allFeaturesFree();

  const [profile, linkedAccounts, calendarGranted, pro] = await Promise.all([
    ensureProfile(viewer.id),
    listSignInMethods(viewer.id),
    hasCalendarAccess(viewer.id),
    proOff
      ? Promise.resolve(null)
      : Promise.all([subscriptionOf(viewer.id), proPrices()]).then(([subscription, prices]) => ({ subscription, prices })),
  ]);

  const name = profile.displayName ?? viewer.name;
  const vibeTags = readVibeTags(profile.vibeTags);

  return (
    <>
      <AccountTabs current="profile" userId={viewer.id} />
      <AccountPage title="Your profile" titleInBar>
        <div className="mx-auto flex w-full max-w-[41.25rem] flex-col gap-3">
          {/* The face someone lands on when they click you, shown as they'd see it. */}
          <Panel>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <FaceEditor name={name} />
              {vibeTags.length ? (
                <div className="flex w-full min-w-0 flex-none flex-wrap gap-1.5 sm:w-auto sm:flex-1">
                  {vibeTags.map((t) => (
                    <Badge key={t} tone="marine">
                      {t}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </Panel>

          <AccountSettings
            email={viewer.email}
            profile={profile}
            linkedAccounts={linkedAccounts}
            calendarGranted={calendarGranted}
            pro={pro}
            opened={settingsSectionFor(asked, proOff)}
            billing={asked.billing}
          />
        </div>
      </AccountPage>
    </>
  );
}
