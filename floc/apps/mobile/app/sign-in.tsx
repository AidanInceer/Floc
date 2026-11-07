/**
 * Signing in (#289). Why Google first, then email: the provider is one tap and the web leads with it.
 * Why the notice: a session the server refused ends here, and the person is told rather than stranded.
 */
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GoogleButton } from "@/components/auth/google-button";
import { Body, Button, Dropdown, Field, OrRule, Screen } from "@/components/system/ui";
import { useTheme } from "@/components/system/theme";
import { takeEndedNotice } from "@/lib/session/session-ended";
import { TextLink } from "@/components/system/text-controls";
import { signIn } from "@/lib/auth";
import { explainGoogle, explainSignIn } from "@/lib/auth-errors";
import type { DevAccount } from "@/lib/dev-sign-in";
import { devAccounts, devSignIn } from "@/lib/dev-sign-in";
import { fonts, radius, size, space } from "@/lib/theme";
import { Text } from "react-native";

export default function SignIn() {
  const router = useRouter();
  // The screen has no bottom bar to hold the gesture indicator off, and the
  // dev door is pinned to the foot — without this it sits under the handle.
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [cast, setCast] = useState<DevAccount[]>([]);
  const [asWho, setAsWho] = useState("");
  const [ended] = useState(takeEndedNotice);
  const { c } = useTheme();

  // Asked once, on a dev build only. A store build never runs this branch, and
  // a phone with no dev server on the LAN gets null and simply shows no picker.
  useEffect(() => {
    if (!__DEV__) return;
    void devAccounts().then((found) => {
      if (!found) return;
      setCast(found);
      setAsWho(found[0].email);
    });
  }, []);

  async function withPassword() {
    setBusy(true);
    setProblem(null);
    const { error } = await signIn.email({ email: email.trim(), password });
    setBusy(false);
    if (error) setProblem(explainSignIn(error));
    else router.replace("/trips");
  }

  async function withGoogle() {
    setBusy(true);
    setProblem(null);
    const { error } = await signIn.social({ provider: "google", callbackURL: "/trips" });
    setBusy(false);
    if (error) setProblem(explainGoogle(error));
  }

  async function asDevUser() {
    setBusy(true);
    setProblem(null);
    const trouble = await devSignIn(cast.find((a) => a.email === asWho));
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
          <View style={{ alignItems: "center", gap: space.xs, paddingTop: space.sm }}>
            <Text style={{ color: c.ink, fontFamily: fonts.displayBold, fontSize: size.display, textAlign: "center" }}>
              Group trip planning, simplified.
            </Text>
            <Body tone="ink-2">Where, when, the plan, and who owes who.</Body>
          </View>

          {ended ? (
            <View style={{ backgroundColor: c["pastel-yellow"], borderRadius: radius.sm, padding: space.md }}>
              <Body tone="pastel-yellow-ink">You were signed out. Sign in again to carry on.</Body>
            </View>
          ) : null}

          <GoogleButton label="Continue with Google" onPress={withGoogle} disabled={busy} />

          <OrRule label="or with email" />

          <View style={{ gap: space.md }}>
            <Field
              label="Email"
              testID="sign-in-email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              inputMode="email"
            />
            <Field
              label="Password"
              testID="sign-in-password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
            />

            {problem ? <Body tone="red">{problem}</Body> : null}

            <Button label="Sign in" onPress={withPassword} busy={busy} />
            <TextLink
              label="Forgotten your password?"
              disabled={busy}
              onPress={() => router.push("/forgot-password")}
            />
          </View>

          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: space.xs }}>
            <Body tone="ink-2">New to Floc?</Body>
            <TextLink label="Create an account" disabled={busy} onPress={() => router.push("/sign-up")} />
          </View>

          <View style={{ flex: 1, minHeight: space.xl }} />

          {__DEV__ ? (
            <View style={{ paddingBottom: insets.bottom, gap: space.sm }}>
              {cast.length > 1 ? (
                <Dropdown
                  label="Sign in as"
                  value={asWho}
                  options={cast.map((a) => ({ value: a.email, label: a.name }))}
                  onChange={setAsWho}
                />
              ) : null}
              <Button
                label="Dev Sign In"
                variant="danger"
                disabled={busy}
                onPress={asDevUser}
              />
            </View>
          ) : null}
        </Screen>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
