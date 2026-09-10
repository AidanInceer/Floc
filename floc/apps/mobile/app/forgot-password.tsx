/**
 * Asking for a reset link (#no-ticket; the web's `/forgot-password`).
 *
 * IT ALWAYS SAYS THE SAME THING. Whether an address has an account is not this
 * screen's to reveal — a refusal and a success both end on the sent notice,
 * exactly as the web form does.
 *
 * THE LINK COMES BACK INTO THE APP. `RESET_REDIRECT` is the `floc://` scheme,
 * which Better Auth is told to trust, so opening the mail on the phone lands
 * on `/reset-password` here rather than on the website.
 */
import { isValidEmail } from "@floc/core/text/credentials";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { Body, Button, Field, Heading, Screen } from "@/components/system/ui";
import { RESET_REDIRECT, requestPasswordReset } from "@/lib/auth";
import { OFFLINE, unreachable } from "@/lib/auth-errors";
import { space } from "@/lib/theme";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function send() {
    setProblem(null);
    if (!isValidEmail(email)) {
      setProblem("That doesn't look like an email address.");
      return;
    }

    setBusy(true);
    const { error } = await requestPasswordReset({
      email: email.trim(),
      redirectTo: RESET_REDIRECT,
    });
    setBusy(false);

    if (error && unreachable(error)) {
      setProblem(OFFLINE);
      return;
    }
    // Anything else is reported as sent: naming "no such account" would let
    // anyone test which addresses are registered.
    setSent(true);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Screen>
          <View style={{ gap: space.xs }}>
            <Heading>Forgotten password</Heading>
            <Body tone="ink-2">We&apos;ll send a link to set a new one.</Body>
          </View>

          {sent ? (
            <View style={{ gap: space.md }}>
              <Body>
                If that address has an account, a reset link is on its way. It
                expires within the hour. Open it on this phone and it brings you
                back here.
              </Body>
              <Button label="Back to sign in" variant="quiet" onPress={() => router.back()} />
            </View>
          ) : (
            <View style={{ gap: space.md }}>
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                inputMode="email"
                autoFocus
              />
              {problem ? <Body tone="red">{problem}</Body> : null}
              <Button label="Send reset link" onPress={send} busy={busy} />
              <Button
                label="Back to sign in"
                variant="quiet"
                fit="small"
                disabled={busy}
                onPress={() => router.back()}
              />
            </View>
          )}
        </Screen>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
