/**
 * Signing in (ticket 289; the other three doors added #no-ticket).
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
 *
 * FIVE BOXES OF EQUAL WEIGHT IS NOT A HIERARCHY. This screen used to draw
 * "Sign in", Google, the dev door, "Create an account" and "Forgotten your
 * password?" as one stack of identical pills, so nothing on it said which one
 * you came for. Now there are three tiers and they are drawn as three:
 *
 *   - Sign in is the primary and the only filled control.
 *   - Google is Google's own button, below an "or" rule that says the two are
 *     alternatives rather than a sequence.
 *   - Creating an account is the quiet outline; forgetting a password is a
 *     centred line of text, because it is a rare afterthought and not a job.
 *
 * THE DEV DOOR IS AT THE FOOT, IN BLUSH. It is the one control here that is
 * not for a real person, so it sits under everything with the screen's empty
 * space above it, wearing the one colour nothing else on the screen wears.
 * A store build never contains the branch at all.
 *
 * NO PITCH ABOVE THE FORM. A heading and a sentence sold the product to
 * somebody who has already installed it and come back to sign in. What is left
 * is the mark and four words centred under it — who, then what.
 *
 * SIGNING UP NO LONGER OPENS THE WEBSITE. It used to, and the sentence under
 * the button explaining that was the tell: a control that leaves the app is
 * not a way in, it is an apology. `/sign-up` is a screen now.
 */
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GoogleButton } from "@/components/auth/google-button";
import {
  Body,
  Button,
  Dropdown,
  Field,
  OrRule,
  Screen,
  TextLink,
} from "@/components/system/ui";
import { signIn } from "@/lib/auth";
import { explainGoogle, explainSignIn } from "@/lib/auth-errors";
import type { DevAccount } from "@/lib/dev-sign-in";
import { devAccounts, devSignIn } from "@/lib/dev-sign-in";
import { space } from "@/lib/theme";

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
          {/* Four words under the mark, centred on it — the mark says who,
              this says what, and together they are the whole introduction. */}
          <View style={{ alignItems: "center" }}>
            <Body tone="ink-2">Trip planning, sorted</Body>
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
            <TextLink
              label="Forgotten your password?"
              disabled={busy}
              onPress={() => router.push("/forgot-password")}
            />
          </View>

          <OrRule label="or" />

          <View style={{ gap: space.md }}>
            <GoogleButton label="Continue with Google" onPress={withGoogle} disabled={busy} />
            <Button
              label="Create an account"
              variant="quiet"
              disabled={busy}
              onPress={() => router.push("/sign-up")}
            />
          </View>

          {/* Everything above keeps its own height; this takes the slack, so
              the dev door sits on the bottom edge on a tall screen and simply
              follows the stack on a short one. */}
          <View style={{ flex: 1, minHeight: space.xl }} />

          {/* Only on a dev build, and only when the dev server is offering an
              account — a store build never contains this branch. */}
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
