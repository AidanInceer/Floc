import { Alert, View } from "react-native";

import { GoogleCalendarMark } from "@/components/auth/google-button";
import { Body, Button, Label, Row } from "../system/ui";
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
  calendar = null,
}: {
  email: string;
  methods: SignInMethod[];
  busy: boolean;
  onUnlink: (accountId: string) => void;
  calendar?: { busy: boolean; problem: string | null; onRemove: () => void } | null;
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
        {calendar ? (
          <Row>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <GoogleCalendarMark />
              <View style={{ flex: 1 }}>
                <Body>Google Calendar</Body>
                <Body tone="ink-3">Reads when you&apos;re busy</Body>
              </View>
            </View>
            <Button label="Remove" variant="quiet" disabled={calendar.busy} onPress={calendar.onRemove} />
          </Row>
        ) : null}
        {calendar?.problem ? <Body tone="red">{calendar.problem}</Body> : null}
        {last ? (
          <Body tone="ink-3">
            This is your only way back in, so it can&apos;t be unlinked.
          </Body>
        ) : null}
      </View>
    </View>
  );
}

export function SettingsDelete({ busy, onDelete }: { busy: boolean; onDelete: () => void }) {
  return (
    <View style={{ gap: space.md }}>
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
