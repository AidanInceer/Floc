/**
 * Creating an account on the phone (#no-ticket).
 *
 * THE SAME DOOR THE WEBSITE USES. One Better Auth instance, one user table —
 * this screen calls `signUp.email` against the very server `/signup` posts to,
 * so an account made here is the same row, and the same verification mail goes
 * out on the way (`emailVerification.sendOnSignUp`).
 *
 * NO SIGNUP CHANNEL. The web writes `signup_channel` from a `?via=` on the
 * link that brought somebody in. A phone install has no such link, so there is
 * nothing truthful to record and the column keeps its default.
 *
 * IT IS DRAWN LIKE SIGN-IN, because it is the same screen with one more field
 * — one filled primary, an "or" rule, then Google's own button.
 *
 * VERIFICATION IS NOT A WALL HERE. Sign-in is not gated on it (#149); the
 * account works from the first screen, and the unconfirmed state is said on
 * You, where it can be resent.
 */
import { isValidEmail, passwordWeakness } from "@floc/core/credentials";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { GoogleButton } from "@/components/google-button";
import { Body, Button, Field, Heading, OrRule, Screen, TextLink } from "@/components/ui";
import { signIn, signUp } from "@/lib/auth";
import { explainGoogle, explainSignUp } from "@/lib/auth-errors";
import { space } from "@/lib/theme";

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function withPassword() {
    setProblem(null);
    if (!name.trim()) {
      setProblem("The group needs a name to put beside you.");
      return;
    }
    if (!isValidEmail(email)) {
      setProblem("That doesn't look like an email address.");
      return;
    }
    const weak = passwordWeakness(password);
    if (weak) {
      setProblem(weak);
      return;
    }

    setBusy(true);
    const { error } = await signUp.email({ name: name.trim(), email: email.trim(), password });
    setBusy(false);
    if (error) setProblem(explainSignUp(error));
    else router.replace("/trips");
  }

  async function withGoogle() {
    setBusy(true);
    setProblem(null);
    // Google reports the address already verified, so a Google account never
    // meets the confirm-your-email card.
    const { error } = await signIn.social({ provider: "google", callbackURL: "/trips" });
    setBusy(false);
    if (error) setProblem(explainGoogle(error));
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Screen>
          <View style={{ gap: space.xs }}>
            <Heading>Create an account</Heading>
            <Body tone="ink-2">Takes a minute. No card, nothing else to install.</Body>
          </View>

          <View style={{ gap: space.md }}>
            <Field
              label="Name"
              value={name}
              onChangeText={setName}
              autoComplete="name"
              autoCapitalize="words"
            />
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
              autoComplete="new-password"
            />
            {/* The rule is invisible until it is broken, so it is said once
                here rather than only as a rejection. */}
            <Body tone="ink-3">At least 8 characters, with a letter and a number.</Body>

            {problem ? <Body tone="red">{problem}</Body> : null}

            <Button label="Create account" onPress={withPassword} busy={busy} />
          </View>

          <OrRule label="or" />

          <GoogleButton label="Sign up with Google" onPress={withGoogle} disabled={busy} />

          <TextLink
            label="I already have an account"
            disabled={busy}
            onPress={() => router.back()}
          />
        </Screen>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
