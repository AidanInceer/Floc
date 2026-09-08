/**
 * Setting the new password (#no-ticket; the web's `/reset-password`).
 *
 * REACHED BY DEEP LINK, NOT BY NAVIGATION. Better Auth answers the link in the
 * mail with a redirect to `floc://reset-password?token=…`, so the token
 * arrives as a route param and there is no other way onto this screen. An
 * expired or spent link comes back with `?error=` instead, which is why the
 * missing-token branch and the bad-token branch say one thing.
 *
 * IT WORKS SIGNED OUT. That is the whole point — the person cannot sign in.
 * The root layout leaves this route alone for the same reason.
 */
import { passwordWeakness } from "@floc/core/credentials";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { Body, Button, Field, Heading, Screen } from "@/components/ui";
import { resetPassword } from "@/lib/auth";
import { OFFLINE, unreachable } from "@/lib/auth-errors";
import { space } from "@/lib/theme";

const DEAD_LINK = "That link has expired or has already been used. Reset links last an hour and work once.";

export default function ResetPassword() {
  const router = useRouter();
  const { token, error: linkError } = useLocalSearchParams<{
    token?: string;
    error?: string;
  }>();

  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function save() {
    setProblem(null);
    const weak = passwordWeakness(password);
    if (weak) {
      setProblem(weak);
      return;
    }

    setBusy(true);
    const { error } = await resetPassword({ newPassword: password, token: token! });
    setBusy(false);

    if (error) {
      setProblem(unreachable(error) ? OFFLINE : DEAD_LINK);
      return;
    }
    setDone(true);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Screen>
          <Heading>New password</Heading>

          {!token || linkError ? (
            <View style={{ gap: space.md }}>
              <Body tone="ink-2">{DEAD_LINK}</Body>
              <Button
                label="Send a new one"
                onPress={() => router.replace("/forgot-password")}
              />
            </View>
          ) : done ? (
            <View style={{ gap: space.md }}>
              <Body>Your password is set. Sign in with it.</Body>
              <Button label="Sign in" onPress={() => router.replace("/sign-in")} />
            </View>
          ) : (
            <View style={{ gap: space.md }}>
              <Body tone="ink-2">Pick one you haven&apos;t used here before.</Body>
              <Field
                label="New password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
                autoFocus
              />
              <Body tone="ink-3">At least 8 characters, with a letter and a number.</Body>
              {problem ? <Body tone="red">{problem}</Body> : null}
              <Button label="Set new password" onPress={save} busy={busy} />
            </View>
          )}
        </Screen>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
