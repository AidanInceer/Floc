/**
 * Your own profile (ticket 46).
 *
 * The two faces split here: this page is what you *curate* — name, picture,
 * vibe tags, dietary, home currency. Everything about who can see it, plus
 * email, notifications and deleting the account, moved to /settings.
 *
 * It opens with the profile itself rather than with a field, so it reads as a
 * profile and not as a settings form; the editing sits underneath, one card per
 * thing, each saving on its own.
 */
import {
  dropPromptCountries,
  keepPromptCountries,
  setCountryMark,
  updateDietary,
  updateIdentity,
  updateVibeTags,
} from "./actions";
import { requireUser } from "@/server/access";
import { formatDateRange } from "@/lib/dates";
import { DIET_FLAGS, MAX_DIETARY_NOTES, readDietFlags } from "@/lib/dietary";
import { ensureProfile } from "@/server/profile";
import { readVibeTags } from "@/lib/vibe-tags";
import { countryName } from "@/lib/countries";
import { pendingMapPrompts, travelMapFor } from "@/server/travel-map";
import { pastTripsFor } from "@/server/visibility";
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  Field,
  Input,
  Page,
  PageHeader,
  Select,
  Stack,
  Textarea,
} from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/client-ui";
import { TravelMap } from "@/components/travel-map";
import { VibePicker } from "@/components/vibe-picker";

export default async function ProfilePage() {
  const viewer = await requireUser("/profile");
  const profile = await ensureProfile(viewer.id);

  const name = profile.displayName ?? viewer.name;
  const vibeTags = readVibeTags(profile.vibeTags);
  const dietFlags = readDietFlags(profile.dietFlags);
  const pastTrips = await pastTripsFor(viewer.id, profile.pastTripsShow);
  const travelMap = await travelMapFor(viewer.id);
  const mapPrompts = await pendingMapPrompts(viewer.id);

  return (
    <Page>
      <PageHeader
        title="Profile"
        subtitle="Who you are across every trip — not per-trip."
      />

      <Stack gap={6}>
        {/* The profile, not a field: what a friend clicking your face lands on. */}
        <Card>
          {/* Face and name on the left, chips filling the room to their right
              rather than stacking under the name and leaving the card half
              empty. They wrap back underneath on a narrow screen. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 p-5">
            <Avatar name={name} src={profile.avatarUrl ?? viewer.image} size={64} />
            <p className="min-w-0 font-display text-xl font-semibold">{name}</p>
            {vibeTags.length ? (
              <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                {vibeTags.map((t) => (
                  <Badge key={t} tone="marine">
                    {t}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="min-w-0 flex-1 text-sm text-ink-soft">
                No vibe tags yet — pick a few below.
              </p>
            )}
          </div>

          <div className="border-t border-dotted border-rule-strong px-5 py-4">
            <p className="typed mb-2">Trips you&rsquo;ve been on</p>
            {pastTrips.length === 0 ? (
              <p className="text-sm text-ink-soft">
                Nothing here until a trip ends. Trips still being planned never
                appear on a profile.
              </p>
            ) : (
              <Stack gap={2}>
                {pastTrips.map((t) => (
                  <div key={t.id} className="text-sm">
                    <span className="font-semibold">{t.name}</span>
                    <span className="text-ink-soft">
                      {" · "}
                      {formatDateRange(t.startDate, t.endDate)}
                      {t.place ? ` · ${t.place}` : ""}
                    </span>
                  </div>
                ))}
              </Stack>
            )}
          </div>
        </Card>

        {/* One question per trip you're no longer on: its countries stop being
            derived the moment you leave or are removed, so this is the only
            moment they can be kept (ticket 95). An admin deleting or archiving
            a trip never raises it — nobody answers this for somebody else. */}
        {mapPrompts.map((prompt) => (
          <Card key={prompt.tripId} className="border-pen/30">
            <CardHeader
              title={`Keep the countries from ${prompt.tripName}?`}
              hint="You're not on that trip any more, so it has stopped filling in your travel map. Keeping them marks them by hand instead."
            />
            <div className="p-4">
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
                    <SubmitButton pendingLabel="Keeping…">Keep them</SubmitButton>
                  </ActionForm>
                  <ActionForm action={dropPromptCountries}>
                    <input type="hidden" name="tripId" value={prompt.tripId} />
                    <SubmitButton variant="ghost" pendingLabel="Removing…">
                      No, drop them
                    </SubmitButton>
                  </ActionForm>
                </div>
              </Stack>
            </div>
          </Card>
        ))}

        <Card>
          <CardHeader
            title="Travel map"
            hint="Countries you've been to and countries you want to go to. Your trips fill it in as they go; anything you set by hand stays set."
          />
          <div className="p-4">
            <TravelMap
              states={travelMap.states}
              editable
              setMark={setCountryMark}
            />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Name and picture"
            hint="Your own copies — Waypoint doesn't mirror them live from Google. No picture means your initials."
          />
          <ActionForm action={updateIdentity} className="p-4">
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
              <Field label="Picture URL" hint="Leave blank for your initials, or your provider photo.">
                <Input
                  name="avatarUrl"
                  defaultValue={profile.avatarUrl ?? ""}
                  placeholder="https://…"
                />
              </Field>
              <Field label="Home currency" hint="Defaults the currency picker in Money. Never shown on your profile.">
                <Select name="homeCurrency" defaultValue={profile.homeCurrency}>
                  <option value="GBP">GBP — £</option>
                  <option value="EUR">EUR — €</option>
                  <option value="USD">USD — $</option>
                </Select>
              </Field>
              <div>
                <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
              </div>
            </Stack>
          </ActionForm>
        </Card>

        <Card>
          <CardHeader
            title="Vibe tags"
            hint="Pick from the list — Waypoint keeps one shared vocabulary so these can be matched up later."
          />
          <ActionForm action={updateVibeTags} className="p-4">
            <Stack gap={4}>
              <VibePicker selected={vibeTags} />
              <div>
                <SubmitButton pendingLabel="Saving…">Save vibe tags</SubmitButton>
              </div>
            </Stack>
          </ActionForm>
        </Card>

        <Card>
          <CardHeader
            title="Dietary"
            hint="Never shown on your profile page — this surfaces where it does work, on a trip deciding where to eat."
          />
          <ActionForm action={updateDietary} className="p-4">
            <Stack gap={4}>
              <div>
                <span className="typed mb-2 block">Diets</span>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {Object.entries(DIET_FLAGS).map(([value, label]) => (
                    <label key={value} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="dietFlag"
                        value={value}
                        defaultChecked={dietFlags.includes(value as never)}
                        className="size-4 rounded-sm border-rule-strong"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <Field
                label="Allergies and intolerances"
                hint="Free text — no preset list covers these."
              >
                <Textarea
                  name="dietaryNotes"
                  defaultValue={profile.dietaryNotes ?? ""}
                  maxLength={MAX_DIETARY_NOTES}
                  placeholder="e.g. coeliac; severe nut allergy"
                />
              </Field>
              {/* One switch for the whole record — you can't publish half a
                  dietary record (ticket 46). */}
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  name="shareDietary"
                  defaultChecked={profile.shareDietary}
                  className="mt-0.5 size-4 rounded-sm border-rule-strong"
                />
                <span>
                  Share this with people I&rsquo;m on a trip with
                  <span className="block text-xs text-ink-faint">
                    All of it or none of it — the diets and the free text move together.
                  </span>
                </span>
              </label>
              <div>
                <SubmitButton pendingLabel="Saving…">Save dietary</SubmitButton>
              </div>
            </Stack>
          </ActionForm>
        </Card>
      </Stack>
    </Page>
  );
}
