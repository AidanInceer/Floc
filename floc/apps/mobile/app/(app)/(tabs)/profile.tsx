/**
 * You (ticket 302) — what you curate, then what you configure.
 *
 * THE SPLIT IS KEPT. The web app has /profile and /settings, and collapsing
 * them makes a screen that is neither. So: the face at the top, the counts and
 * trips under it, and settings plainly separated below a rule. Only what a
 * phone can honestly own is here — theme and signing out. Visibility, dietary,
 * vibe tags, notifications and deleting the account stay on the web, where
 * they are already edited, and the screen says so rather than going quiet.
 *
 * THE COUNTS ARE DERIVED (#95). Been and want-to-go come off the trips you are
 * on, read fresh, never stored — so this can never disagree with the map the
 * web app draws.
 *
 * SIGNING OUT ENDS THIS DEVICE ONLY. The web session is a different row.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { useTheme, type ThemeChoice } from "@/components/theme";
import {
  Body,
  Button,
  Card,
  Divider,
  Failed,
  Field,
  Figure,
  Heading,
  Label,
  Loading,
} from "@/components/ui";
import { trpc } from "@/lib/api";
import { signOut } from "@/lib/auth";
import { space } from "@/lib/theme";

const THEMES: readonly { value: ThemeChoice; label: string }[] = [
  { value: "system", label: "Match my phone" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export default function Profile() {
  const queryClient = useQueryClient();
  const { choice, setChoice } = useTheme();
  const me = useQuery(trpc.me.get.queryOptions());

  const [name, setName] = useState<string | null>(null);

  const rename = useMutation({
    ...trpc.me.rename.mutationOptions(),
    onSuccess: () => {
      setName(null);
      queryClient.invalidateQueries({ queryKey: trpc.me.get.queryKey() });
    },
  });

  if (me.isPending) return <Loading />;
  if (me.isError) return <Failed onRetry={() => me.refetch()} />;

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      <Card>
        <View style={{ gap: space.sm }}>
          <Heading>{me.data.name}</Heading>
          <Figure tone="ink-2">
            {me.data.been} been · {me.data.wantToGo} want to go
          </Figure>
          <Figure tone="ink-3">
            {me.data.tripCount} {me.data.tripCount === 1 ? "trip" : "trips"} on the go
          </Figure>
        </View>
      </Card>

      {name === null ? (
        <Button label="Change your name" variant="quiet" onPress={() => setName(me.data.name)} />
      ) : (
        <Card>
          <View style={{ gap: space.md }}>
            <Field label="Your name" value={name} onChangeText={setName} autoFocus />
            <Button
              label="Save"
              busy={rename.isPending}
              onPress={() => rename.mutate({ displayName: name })}
            />
            <Button label="Cancel" variant="quiet" onPress={() => setName(null)} />
            {rename.isError ? <Body tone="red">{rename.error.message}</Body> : null}
          </View>
        </Card>
      )}

      {/* What is missing is worth saying; what is drawn is not (#126). */}
      <Body tone="ink-3">Your picture is set on the website.</Body>

      <Divider />

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
      </View>

      <View style={{ gap: space.sm }}>
        <Label>Account</Label>
        <Body tone="ink-3">
          Notifications, privacy and deleting your account are on the website.
        </Body>
        {/* This device only — the web session is a different row. */}
        <Button label="Sign out of this phone" variant="quiet" onPress={() => signOut()} />
      </View>
    </ScrollView>
  );
}
