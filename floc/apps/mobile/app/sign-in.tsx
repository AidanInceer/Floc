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
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { Body, Button, Field, Heading, Screen } from "@/components/ui";
import { signIn } from "@/lib/auth";
import { space } from "@/lib/theme";

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
    // Deliberately one message for a wrong address and a wrong password: which
    // one was wrong is an answer to "does this account exist".
    if (error) setProblem("That email and password don't match.");
    else router.replace("/(app)/trips");
  }

  async function withGoogle() {
    setBusy(true);
    setProblem(null);
    const { error } = await signIn.social({ provider: "google", callbackURL: "/trips" });
    setBusy(false);
    if (error) setProblem("Google sign-in isn't available right now.");
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

          {/* Signing up stays on the website: it needs the terms, the privacy
              policy and email verification, none of which are built here yet. */}
          <Body tone="ink-3">New here? Create your account on floc.app, then sign in.</Body>
        </Screen>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
