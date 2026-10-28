/**
 * Your own profile (ticket 46; redesigned 201, reordered 236).
 *
 * The two faces split here: this page is what you *curate* — name, picture,
 * vibe tags, home currency. Everything about who can see it, plus
 * email, notifications and deleting the account, moved to /settings.
 *
 * Face first: the card someone lands on, then what you've actually done (map,
 * trips). Only your name and picture are edited here, from the card itself —
 * vibe tags, packing and your home currency all moved to /settings, so this
 * page reads as a profile rather than as a settings form (ticket 236).
 */

import {
  dropPromptCountries,
  keepPromptCountries,
  setCountryMark,
} from "./actions";
import { requireUser } from "@/server/access";
import { formatDateRange } from "@floc/core/dates/dates";
import { ensureProfile } from "@/server/auth/profile";
import { readVibeTags } from "@floc/core/trip/vibe-tags";
import { countryName } from "@floc/core/people/countries";
import { pendingMapPrompts, travelMapFor } from "@/server/itinerary/travel-map";
import { pastTripsFor } from "@/server/auth/visibility";
import { AccountPage, Panel } from "@/components/auth/account-ui";
import { Badge, Stack } from "@/components/system/ui";
import { FaceEditor } from "@/components/profile/face-editor";
import { ActionForm, SubmitButton } from "@/components/system/client-ui";
import { TravelMap } from "@/components/map/travel-map";

export const metadata = { title: "Your profile" };

export default async function ProfilePage() {
  const viewer = await requireUser("/profile");
  const profile = await ensureProfile(viewer.id);

  const name = profile.displayName ?? viewer.name;
  const vibeTags = readVibeTags(profile.vibeTags);
  const pastTrips = await pastTripsFor(viewer.id, profile.pastTripsShow);
  const travelMap = await travelMapFor(viewer.id);
  const mapPrompts = await pendingMapPrompts(viewer.id);

  const marks = Object.values(travelMap.states);
  const beenCount = marks.filter((s) => s === "green").length;
  const wantCount = marks.filter((s) => s === "yellow").length;

  return (
    <AccountPage title="Your profile">
      {/* The face someone lands on when they click you, shown as they'd see
          it — the page's one moment of the visitor's view. */}
      <Panel>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <FaceEditor name={name} icon={profile.avatarIcon} been={beenCount} wantToGo={wantCount} />
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

      {/* One question per trip you're no longer on: its countries stop being
          derived the moment you leave or are removed, so this is the only
          moment they can be kept (ticket 95). An admin deleting or archiving
          a trip never raises it — nobody answers this for somebody else. */}
      {mapPrompts.map((prompt) => (
        <Panel
          key={prompt.tripId}
          title={`Keep the countries from ${prompt.tripName}?`}
          className="bg-pen-soft text-pen-deep"
        >
          <Stack gap={3}>
            <p className="text-sm">
              {prompt.countries
                .map(
                  (c) =>
                    `${countryName(c.code)} (${
                      c.state === "green" ? "been there" : "want to go"
                    })`,
                )
                .join(", ")}
            </p>
            <div className="flex flex-wrap gap-2">
              <ActionForm action={keepPromptCountries}>
                <input type="hidden" name="tripId" value={prompt.tripId} />
                <SubmitButton variant="primary" pendingLabel="Keeping…">
                  Keep them
                </SubmitButton>
              </ActionForm>
              <ActionForm action={dropPromptCountries}>
                <input type="hidden" name="tripId" value={prompt.tripId} />
                <SubmitButton variant="ghost" pendingLabel="Removing…">
                  No, drop them
                </SubmitButton>
              </ActionForm>
            </div>
          </Stack>
        </Panel>
      ))}

      <TravelMap title="Travel map" states={travelMap.states} setMark={setCountryMark} />

      <Panel title="Trips you've been on">
        {pastTrips.length === 0 ? (
          <p className="text-sm text-ink-soft">Nothing here yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pastTrips.map((t) => (
              <li key={t.id} className="rounded-md bg-sheet-2 px-3 py-2 text-sm">
                <span className="font-semibold">{t.name}</span>
                <span className="text-ink-soft">
                  {" · "}
                  {formatDateRange(t.startDate, t.endDate)}
                  {t.place ? ` · ${t.place}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

    </AccountPage>
  );
}
