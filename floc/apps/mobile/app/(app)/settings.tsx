/**
 * Settings — what you configure, as against what you curate (ticket 302,
 * direction C; the web's own panels brought over).
 *
 * DRAWERS, GROUPED LIKE THE WEB RAIL. One long scroll of switches read as one
 * wall; three groups of closed drawers, each showing its answer, read as a
 * contents page. Delete sits alone at the foot, out of the way of everything.
 *
 * NO SAVE BUTTONS. A switch or a segmented row *is* the answer, so it is also
 * the write; only the free-text note waits for you to leave it. That is the
 * one place this differs from the web, and it differs because a browser form
 * needs a submit and a phone does not.
 *
 * THE WHOLE PANEL IS WRITTEN EACH TIME. Privacy is six fields and one call —
 * sending the changed one alone would need the server to merge, and a merge is
 * a second place for the record to be half-right.
 */
import type { BillingStatus, MySettings } from "@floc/api/port";
import { CURRENCIES } from "@floc/core/money/currency";
import { PACK_TIERS, PACK_TIER_LABELS, type PackTier } from "@floc/core/packing/packing";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { ScrollView, View } from "react-native";

import { ProSection } from "@/components/billing/pro-section";
import { SettingsAccount, SettingsDelete } from "@/components/settings/settings-account";
import { SettingsDietary, SettingsVibeTags, type Dietary } from "@/components/settings/settings-about";
import { Drawer, DrawerGroup } from "@/components/system/drawer";
import { SettingsPrivacy, type Privacy } from "@/components/settings/settings-privacy";
import { useTheme, type ThemeChoice } from "@/components/system/theme";
import { Body, Dropdown, Failed, Label, Loading, Segmented, Toggle } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { signOut } from "@/lib/auth";
import { proView } from "@/lib/billing/pro";
import { aboutSummary, emailSummary, privacySummary, tripsSummary } from "@/lib/settings/summary";
import { MoonGlyph, SunGlyph } from "@/components/system/glyphs";
import { space } from "@/lib/theme";

const THEMES = [
  { value: "light", label: "Light", icon: (color: string) => <SunGlyph color={color} /> },
  { value: "dark", label: "Dark", icon: (color: string) => <MoonGlyph color={color} /> },
  { value: "system", label: "Auto" },
] satisfies { value: ThemeChoice; label: string; icon?: (color: string) => ReactNode }[];

const THEME_LABELS: Record<ThemeChoice, string> = { light: "Light", dark: "Dark", system: "Auto" };

const CURRENCY_OPTIONS = CURRENCIES.map((code) => ({ value: code, label: code }));

const TIER_OPTIONS = PACK_TIERS.map((tier) => ({
  value: tier,
  label: PACK_TIER_LABELS[tier],
}));

export default function Settings() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const settings = useQuery(trpc.settings.get.queryOptions());
  const billing = useQuery(trpc.billing.status.queryOptions());
  const claim = useMutation(trpc.billing.claim.mutationOptions());

  if (settings.isPending) return <Loading />;
  if (settings.isError) return <Failed onRetry={() => settings.refetch()} />;

  return (
    <SettingsPanels
      settings={settings.data}
      billing={billing.data}
      pro={
        billing.data ? (
          // Pro changes what every trip screen can do, so a purchase refetches everything.
          <ProSection
            status={billing.data}
            claim={(input) => claim.mutateAsync(input)}
            onClaimed={() => queryClient.invalidateQueries()}
          />
        ) : null
      }
      onSaved={() => queryClient.invalidateQueries({ queryKey: trpc.settings.get.queryKey() })}
      onSignedOut={() => router.replace("/")}
    />
  );
}

/**
 * The panels themselves, split from the screen so the loading branch above
 * does not have to hold a dozen `useState` calls it cannot use yet — hooks
 * cannot live behind an early return.
 */
function SettingsPanels({
  settings,
  billing,
  pro,
  onSaved,
  onSignedOut,
}: {
  settings: MySettings;
  billing: BillingStatus | undefined;
  pro: ReactNode;
  onSaved: () => void;
  onSignedOut: () => void;
}) {
  const { choice, setChoice } = useTheme();
  const [privacy, setPrivacy] = useState<Privacy>({
    isPrivate: settings.isPrivate,
    visibilityVibeTags: settings.visibilityVibeTags,
    visibilityTravelMap: settings.visibilityTravelMap,
    visibilityFriends: settings.visibilityFriends,
    pastTripsShow: settings.pastTripsShow,
  });
  const [tags, setTags] = useState<string[]>(settings.vibeTags);
  const [dietary, setDietary] = useState<Dietary>({
    flags: settings.dietFlags,
    notes: settings.dietaryNotes ?? "",
    share: settings.shareDietary,
  });
  const [tier, setTier] = useState<PackTier>(settings.packTier);
  const [autoFill, setAutoFill] = useState(settings.packAutoGenerate);
  const [currency, setCurrency] = useState(settings.homeCurrency);
  const [notify, setNotify] = useState({
    invites: settings.notifyInvites,
    money: settings.notifyMoney,
    nudges: settings.notifyNudges,
  });
  const [failed, setFailed] = useState(false);

  // A write that loses puts the screen and the row out of step, and a
  // silent disagreement is worse than a stale read (rule 7 is last-write-wins,
  // not last-write-invisible).
  const onError = () => setFailed(true);
  const onSuccess = () => {
    setFailed(false);
    onSaved();
  };

  const savePrivacy = useMutation({ ...trpc.settings.privacy.mutationOptions(), onError, onSuccess });
  const saveTags = useMutation({ ...trpc.settings.vibeTags.mutationOptions(), onError, onSuccess });
  const saveDietary = useMutation({ ...trpc.settings.dietary.mutationOptions(), onError, onSuccess });
  const savePacking = useMutation({ ...trpc.settings.packing.mutationOptions(), onError, onSuccess });
  const saveCurrency = useMutation({ ...trpc.settings.currency.mutationOptions(), onError, onSuccess });
  const saveNotify = useMutation({
    ...trpc.settings.notifications.mutationOptions(),
    onError,
    onSuccess,
  });
  const unlink = useMutation({ ...trpc.settings.unlinkSignIn.mutationOptions(), onError, onSuccess });
  const remove = useMutation({
    ...trpc.settings.deleteAccount.mutationOptions(),
    onError,
    onSuccess: () => signOut().then(onSignedOut),
  });

  const plan = billing ? proView(billing) : null;
  const busy = unlink.isPending || remove.isPending;

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.xl }}>
      {failed ? <Body tone="red">That didn&apos;t save. Try it again.</Body> : null}

      <DrawerGroup label="You">
        <Drawer first title="Theme" summary={THEME_LABELS[choice]}>
          <Segmented options={THEMES} value={choice} onChange={setChoice} />
        </Drawer>

        <Drawer title="Privacy" summary={privacySummary(privacy)}>
          <SettingsPrivacy
            privacy={privacy}
            onChange={(next) => {
              setPrivacy(next);
              savePrivacy.mutate(next);
            }}
          />
        </Drawer>

        <Drawer title="About you" summary={aboutSummary(tags.length, dietary.flags.length)}>
          <SettingsVibeTags
            tags={tags}
            onChange={(next) => {
              setTags(next);
              saveTags.mutate({ tags: next as never });
            }}
          />
          <SettingsDietary
            dietary={dietary}
            onChange={(next) => {
              setDietary(next);
              // The free text is the one field that would fire per keystroke, so
              // it waits for the blur below; everything else writes now.
              if (next.notes === dietary.notes) {
                saveDietary.mutate({
                  flags: next.flags as never,
                  notes: next.notes || null,
                  share: next.share,
                });
              }
            }}
            onCommitNotes={() =>
              saveDietary.mutate({
                flags: dietary.flags as never,
                notes: dietary.notes || null,
                share: dietary.share,
              })
            }
          />
        </Drawer>
      </DrawerGroup>

      <DrawerGroup label="Trips">
        <Drawer first title="Packing and money" summary={tripsSummary(PACK_TIER_LABELS[tier], currency)}>
          <View style={{ gap: space.sm }}>
            <Label>Packing</Label>
            {/* Where a new trip starts. Choosing Light on one weekend must not
                become the default everywhere (#220) — worth the line, because a
                defaults screen cannot show that it is defaults. */}
            <Body tone="ink-3">
              Where a new trip starts. Changing it on one trip stays on that trip.
            </Body>
            <Segmented
              options={TIER_OPTIONS}
              value={tier}
              onChange={(next) => {
                setTier(next);
                savePacking.mutate({ tier: next, autoGenerate: autoFill });
              }}
            />
            <Toggle
              label="Fill my bag in when I open a trip's packing"
              value={autoFill}
              onChange={(next) => {
                setAutoFill(next);
                savePacking.mutate({ tier, autoGenerate: next });
              }}
            />
          </View>

          <Dropdown
            label="Home currency"
            options={CURRENCY_OPTIONS}
            value={currency}
            onChange={(next) => {
              setCurrency(next);
              saveCurrency.mutate({ currency: next });
            }}
          />
        </Drawer>

        {plan && plan.kind !== "hidden" ? (
          <Drawer title="Floc Pro" summary={plan.kind === "pro" ? "Pro" : "Free plan"}>
            {pro}
          </Drawer>
        ) : null}

        <Drawer title="Email" summary={emailSummary(notify)}>
          <Toggle
            label="Trip invites"
            value={notify.invites}
            onChange={(invites) => {
              setNotify({ ...notify, invites });
              saveNotify.mutate({ ...notify, invites });
            }}
          />
          <Toggle
            label="Costs added to a trip"
            value={notify.money}
            onChange={(money) => {
              setNotify({ ...notify, money });
              saveNotify.mutate({ ...notify, money });
            }}
          />
          <Toggle
            label="Nudges from other members"
            value={notify.nudges}
            onChange={(nudges) => {
              setNotify({ ...notify, nudges });
              saveNotify.mutate({ ...notify, nudges });
            }}
          />        </Drawer>
      </DrawerGroup>

      <DrawerGroup label="Account">
        <Drawer first title="Sign-in" summary={settings.email}>
          <SettingsAccount
            email={settings.email}
            methods={settings.signInMethods}
            busy={busy}
            onUnlink={(accountId) => unlink.mutate({ accountId })}
          />
        </Drawer>
      </DrawerGroup>

      <DrawerGroup danger>
        <Drawer first danger title="Delete account">
          <SettingsDelete busy={busy} onDelete={() => remove.mutate()} />
        </Drawer>
      </DrawerGroup>
    </ScrollView>
  );
}
