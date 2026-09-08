/**
 * The account itself — email, sign-in methods, and deleting it (ticket 07).
 *
 * EMAIL IS SHOWN, NOT EDITED. It comes from whichever provider signed you in,
 * so it is a fact rather than a field. Drawing it as a disabled input would be
 * a dead control with a sentence explaining why.
 *
 * SIGNING OUT IS NOT HERE. It lives at the foot of You (#no-ticket) — it is
 * the end of a session, not a preference, and burying it under a screen of
 * switches made it the hardest ordinary thing in the app to find.
 *
 * THE LAST METHOD CANNOT BE UNLINKED. The host refuses; this greys the press
 * when there is one left, so the refusal is visible before it happens rather
 * than arriving as an error.
 *
 * DELETE ASKS FIRST, AND SAYS WHAT SURVIVES. Trip content stays, attributed to
 * a deleted user, and trips you solely admin hand over. Somebody deciding
 * deserves to know that before, not after.
 */
import { Alert, View } from "react-native";

import { Body, Button, Divider, Label, Row } from "./ui";
import { space } from "@/lib/theme";

export type SignInMethod = { id: string; provider: string };

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  facebook: "Facebook",
  credential: "Email and password",
};

export function SettingsAccount({
  email,
  methods,
  busy,
  onUnlink,
  onDelete,
}: {
  email: string;
  methods: SignInMethod[];
  busy: boolean;
  onUnlink: (accountId: string) => void;
  onDelete: () => void;
}) {
  const last = methods.length <= 1;

  return (
    <View style={{ gap: space.md }}>
      <View style={{ gap: space.xs }}>
        <Label>Email</Label>
        <Body>{email}</Body>
      </View>

      <View style={{ gap: space.sm }}>
        <Label>Sign-in methods</Label>
        {methods.map((method) => (
          <Row key={method.id}>
            <View style={{ flex: 1 }}>
              <Body>{PROVIDER_LABELS[method.provider] ?? method.provider}</Body>
            </View>
            <Button
              label="Unlink"
              variant="quiet"
              disabled={last || busy}
              onPress={() => onUnlink(method.id)}
            />
          </Row>
        ))}
        {last ? (
          <Body tone="ink-3">
            This is your only way back in, so it can&apos;t be unlinked.
          </Body>
        ) : null}
      </View>

      <Divider />

      <Button
        label="Delete my account"
        variant="danger"
        busy={busy}
        onPress={() =>
          Alert.alert(
            "Delete your Floc account?",
            "Trips you're the only admin of hand over to their earliest-joined member. Costs already logged stay on the ledger. This can't be undone from the app.",
            [
              { text: "Keep it", style: "cancel" },
              { text: "Delete it", style: "destructive", onPress: onDelete },
            ],
          )
        }
      />
    </View>
  );
}
