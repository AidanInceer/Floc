/**
 * Settings — what you configure, as against what you curate (ticket 302,
 * direction C; the web's own panels brought over).
 *
 * ITS OWN SCREEN, BECAUSE THE WEB HAS ITS OWN PAGE. These sat under a rule at
 * the foot of the profile, which made the theme buttons the tallest thing on a
 * page about who you are. A rule is not a split.
 *
 * IT USED TO SAY "ON THE WEBSITE" AND LIST FIVE THINGS. That was honest while
 * the phone had no API for them; it is not a design. Everything the web's
 * `/settings` rail holds is here now — privacy, vibe tags, dietary, packing
 * defaults, home currency, notifications and the account — with theme, which
 * only the phone has, at the top where it started.
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
import type { MySettings } from "@floc/api/port";
import { CURRENCIES } from "@floc/core/currency";
import { PACK_TIERS, PACK_TIER_LABELS, type PackTier } from "@floc/core/packing";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { SettingsAccount } from "@/components/settings-account";
import { SettingsDietary, SettingsVibeTags, type Dietary } from "@/components/settings-about";
import { SettingsPrivacy, type Privacy } from "@/components/settings-privacy";
import { useTheme, type ThemeChoice } from "@/components/theme";
import { Body, Button, Divider, Dropdown, Failed, Label, Loading, Segmented, Toggle } from "@/components/ui";
import { trpc } from "@/lib/api";
import { signOut } from "@/lib/auth";
import { space } from "@/lib/theme";

const THEMES: readonly { value: ThemeChoice; label: string }[] = [
  { value: "system", label: "Match my phone" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const CURRENCY_OPTIONS = CURRENCIES.map((code) => ({ value: code, label: code }));

const TIER_OPTIONS = PACK_TIERS.map((tier) => ({
  value: tier,
  label: PACK_TIER_LABELS[tier],
}));

export default function Settings() {
  const { choice, setChoice } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const settings = useQuery(trpc.settings.get.queryOptions());

  if (settings.isPending) return <Loading />;
  if (settings.isError) return <Failed onRetry={() => settings.refetch()} />;

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.xl }}>
      <View style={{ gap: space.sm }}>
        <Label>Theme</Label>
        {/* Three states will not fit one segmented row on a narrow phone, and
            "Match my phone" is a sentence rather than a word. Rows, then. */}
        {THEMES.map((option) => (
          <Button
            key={option.value}
            label={option.value === choice ? `${option.label} — on` : option.label}
            variant={option.value === choice ? "primary" : "quiet"}
            onPress={() => setChoice(option.value)}
          />
        ))}
        {/* Theme is this device's, and the web has none — worth one line,
            because nothing on screen could show it. */}
        <Body tone="ink-3">This phone only. Everything below follows you everywhere.</Body>
      </View>

      <Divider />

      <SettingsPanels
        settings={settings.data}
        onSaved={() =>
          queryClient.invalidateQueries({ queryKey: trpc.settings.get.queryKey() })
        }
        onSignedOut={() => router.replace("/")}
      />
    </ScrollView>
  );
}

/**
 * The panels themselves, split from the screen so the loading branch above
 * does not have to hold a dozen `useState` calls it cannot use yet — hooks
 * cannot live behind an early return.
 */
function SettingsPanels({
  settings,
  onSaved,
  onSignedOut,
}: {
  settings: MySettings;
  onSaved: () => void;
  onSignedOut: () => void;
}) {
  const [privacy, setPrivacy] = useState<Privacy>({
    isPrivate: settings.isPrivate,
    visibilityPicture: settings.visibilityPicture,
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

  return (
    <View style={{ gap: space.xl }}>
      {failed ? <Body tone="red">That didn&apos;t save. Try it again.</Body> : null}

      <SettingsPrivacy
        privacy={privacy}
        onChange={(next) => {
          setPrivacy(next);
          savePrivacy.mutate(next);
        }}
      />

      <Divider />

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

      <Divider />

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
          hint="Off means the list stays empty until you ask."
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

      <Divider />

      <View style={{ gap: space.sm }}>
        <Label>Email notifications</Label>
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
        />
        <Body tone="ink-3">An invite you asked for always sends, whatever these say.</Body>
      </View>

      <Divider />

      <SettingsAccount
        email={settings.email}
        methods={settings.signInMethods}
        busy={unlink.isPending || remove.isPending}
        onUnlink={(accountId) => unlink.mutate({ accountId })}
        onSignOut={() => signOut().then(onSignedOut)}
        onDelete={() => remove.mutate()}
      />
    </View>
  );
}
