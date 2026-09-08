/**
 * Signing in (ticket 289).
 *
 * Email and password, plus Google through the native flow — not the web
 * redirect. The distinction matters: `signIn.social` with the Expo plugin
 * opens the system browser sheet and comes back through the `floc://` scheme,
 * so the person never leaves the app and never sees a browser chrome they
 * cannot dismiss.
 *
 * Google is offered unconditionally. If the server has no Google credentials
 * it answers with an error and the person falls back to a password — a
 * reduced feature, never a crash (rule 11).
 */
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, ScrollView, View } from "react-native";

import { Body, Button, Field, Heading, Screen } from "@/components/ui";
import { signIn } from "@/lib/auth";
import { devSignIn } from "@/lib/dev-sign-in";
import { API_BASE_URL } from "@/lib/config";
import { space } from "@/lib/theme";

const OFFLINE = `Can't reach ${API_BASE_URL}. Check the server is running and the phone can see it.`;

/**
 * A request that never arrived carries no status, so Better Auth reports it the
 * same shape as a refusal. Telling the two apart matters most in development,
 * where a firewalled dev server otherwise reads as a wrong password.
 */
function unreachable(error: { status?: number }): boolean {
  return !error.status;
}

function explain(error: { status?: number }): string {
  // Deliberately one message for a wrong address and a wrong password: which
  // one was wrong is an answer to "does this account exist".
  return unreachable(error) ? OFFLINE : "That email and password don't match.";
}

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function withPassword() {
    setBusy(true);
    setProblem(null);
    const { error } = await signIn.email({ email: email.trim(), password });
    setBusy(false);
    if (error) setProblem(explain(error));
    else router.replace("/trips");
  }

  async function withGoogle() {
    setBusy(true);
    setProblem(null);
    const { error } = await signIn.social({ provider: "google", callbackURL: "/trips" });
    setBusy(false);
    if (error) setProblem(unreachable(error) ? OFFLINE : "Google sign-in isn't available right now.");
  }

  async function asDevUser() {
    setBusy(true);
    setProblem(null);
    const trouble = await devSignIn();
    setBusy(false);
    if (trouble) setProblem(trouble);
    else router.replace("/trips");
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Screen>
          <View style={{ gap: space.xs }}>
            <Heading>Plan a trip with the group</Heading>
            <Body tone="ink-2">Where, when, in what order, and who owes who.</Body>
          </View>

          <View style={{ gap: space.md }}>
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              inputMode="email"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
            />

            {problem ? <Body tone="red">{problem}</Body> : null}

            <Button label="Sign in" onPress={withPassword} busy={busy} />
            <Button label="Continue with Google" onPress={withGoogle} variant="quiet" disabled={busy} />
          </View>

          {/* Only on a dev build, and only when the dev server is offering an
              account — a store build never contains this branch. */}
          {__DEV__ ? (
            <Button label="Sign in as the dev user" variant="quiet" disabled={busy} onPress={asDevUser} />
          ) : null}

          {/* Signing up stays on the website: it needs the terms, the privacy
              policy and email verification, none of which are built here yet.
              It still needs a control here — a sentence naming a website is not
              a way in. */}
          <View style={{ gap: space.xs }}>
            <Button
              label="Create an account"
              variant="quiet"
              disabled={busy}
              onPress={() => void Linking.openURL(`${API_BASE_URL}/signup`)}
            />
            <Body tone="ink-3">Opens the website. Come back here to sign in.</Body>
          </View>
        </Screen>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
