/**
 * Profile (ticket 18): identity fields that are ours to edit, plus the
 * account's email and connected sign-in methods, which are Better Auth's and
 * shown read-only. Display name/avatar are our own copies, independently
 * editable — not mirrored live from whichever provider signed you in
 * (ticket 06).
 */
import { eq } from "drizzle-orm";

import { updateProfile, unlinkAccount } from "./actions";
import { db } from "@/db";
import { account } from "@/db/schema";
import { requireUser } from "@/lib/access";
import { ensureProfile } from "@/lib/profile";
import {
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

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  facebook: "Facebook",
  credential: "Email & password",
};

export default async function ProfilePage() {
  const viewer = await requireUser("/profile");
  const profile = await ensureProfile(viewer.id);

  const linkedAccounts = await db
    .select({ id: account.id, providerId: account.providerId })
    .from(account)
    .where(eq(account.userId, viewer.id))
    .all();

  const vibeText = (profile.vibePreferences ?? []).join("\n");

  return (
    <Page>
      <PageHeader
        title="Profile"
        subtitle="Your identity across every trip — not per-trip."
      />
      <Stack gap={6}>
        <Card>
          <CardHeader
            title="Identity"
            hint="Display name and avatar are your own, independently editable — Waypoint doesn't mirror them live from Google."
          />
          <ActionForm action={updateProfile} className="p-4">
            <Stack gap={4}>
              <Field label="Email" hint="From your sign-in provider — not editable here.">
                <Input value={viewer.email} disabled readOnly />
              </Field>
              <Field label="Display name">
                <Input
                  name="displayName"
                  defaultValue={profile.displayName ?? viewer.name}
                  placeholder={viewer.name}
                />
              </Field>
              <Field label="Avatar URL" hint="Leave blank to use your provider photo.">
                <Input
                  name="avatarUrl"
                  defaultValue={profile.avatarUrl ?? ""}
                  placeholder="https://…"
                />
              </Field>
              <Field label="Home currency" hint="Defaults the currency picker in Money.">
                <Select name="homeCurrency" defaultValue={profile.homeCurrency}>
                  <option value="GBP">GBP — £</option>
                  <option value="EUR">EUR — €</option>
                  <option value="USD">USD — $</option>
                </Select>
              </Field>
              <Field
                label="Vibe preferences"
                hint="One per line (or comma-separated) — seeds the idea board on new trips."
              >
                <Textarea
                  name="vibePreferences"
                  defaultValue={vibeText}
                  placeholder={"beach days\nslow mornings\nstreet food\nhiking\nmuseums"}
                  className="min-h-24"
                />
              </Field>
              <div>
                <SubmitButton pendingLabel="Saving…">Save profile</SubmitButton>
              </div>
            </Stack>
          </ActionForm>
        </Card>

        <Card>
          <CardHeader
            title="Connected sign-in methods"
            hint="Unlinking your last remaining method is refused — you'd lose access."
          />
          <div className="p-4">
            <Stack gap={3}>
              {linkedAccounts.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3">
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
                </div>
              ))}
            </Stack>
          </div>
        </Card>
      </Stack>
    </Page>
  );
}
