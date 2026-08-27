/**
 * Your own profile (ticket 46; redesigned 201, reordered 236).
 *
 * The two faces split here: this page is what you *curate* — name, picture,
 * vibe tags, dietary, home currency. Everything about who can see it, plus
 * email, notifications and deleting the account, moved to /settings.
 *
 * Face first: the card someone lands on, then what you've actually done (map,
 * trips). Only your name and picture are edited here — vibe tags, packing,
 * dietary and your home currency all moved to /settings, so this page reads as
 * a profile rather than as a settings form (ticket 236).
 */

import {
  dropPromptCountries,
  keepPromptCountries,
  setCountryMark,
  updateIdentity,
} from "./actions";
import { requireUser } from "@/server/access";
import { formatDateRange } from "@/lib/dates";
import { ensureProfile } from "@/server/profile";
import { readVibeTags } from "@/lib/vibe-tags";
import { countryName } from "@/lib/countries";
import { pendingMapPrompts, travelMapFor } from "@/server/travel-map";
import { pastTripsFor } from "@/server/visibility";
import { AccountPage, Panel, RowList, SettingRow } from "@/components/account-ui";
import { Avatar, Badge, Field, Input, Stack } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/client-ui";
import { TravelMap } from "@/components/travel-map";

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
      <Panel className="bg-butter text-butter-ink">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <Avatar name={name} src={profile.avatarUrl ?? viewer.image} size={64} />
          <div className="min-w-0">
            <p className="font-display text-2xl font-semibold text-ink">{name}</p>
            <p className="nums mt-1 text-sm">
              {beenCount} been · {wantCount} want to go
            </p>
          </div>
          {vibeTags.length ? (
            <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
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

      <Panel title="Travel map">
        <TravelMap states={travelMap.states} editable setMark={setCountryMark} />
      </Panel>

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

      {/* The only thing you edit from here — everything else about you moved
          to /settings (ticket 236). */}
      <RowList>
        <SettingRow label="Name and picture" value={name}>
          <ActionForm action={updateIdentity}>
            <Stack gap={4}>
              <Field label="Display name">
                <Input
                  name="displayName"
                  defaultValue={profile.displayName ?? viewer.name}
                  placeholder={viewer.name}
                />
              </Field>
              {/* Still a URL field: real uploading is its own decision, and
                  until it lands this is the only way to have a picture at all
                  (ticket 46 carved it out to a follow-up). */}
              <Field label="Picture URL" hint="Blank means your initials.">
                <Input
                  name="avatarUrl"
                  defaultValue={profile.avatarUrl ?? ""}
                  placeholder="https://…"
                />
              </Field>
              <div>
                <SubmitButton variant="primary" pendingLabel="Saving…">
                  Save
                </SubmitButton>
              </div>
            </Stack>
          </ActionForm>
        </SettingRow>

      </RowList>
    </AccountPage>
  );
}
