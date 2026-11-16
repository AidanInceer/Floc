import { useState } from "react";
import { View } from "react-native";

import { Body, Button, Card } from "../system/ui";
import { OFFLINE, unreachable } from "@/lib/auth-errors";
import { VERIFY_REDIRECT, sendVerificationEmail } from "@/lib/auth";
import { space } from "@/lib/theme";

export function VerifyEmailCard({
  email,
  verified,
  canConfirm,
}: {
  email: string;
  verified: boolean;
  canConfirm: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const nothingToSay = verified || !canConfirm;

  async function resend() {
    setBusy(true);
    setProblem(null);
    const { error } = await sendVerificationEmail({
      email,
      callbackURL: VERIFY_REDIRECT,
    });
    setBusy(false);
    if (error) setProblem(unreachable(error) ? OFFLINE : "That didn't send. Try it again.");
    else setSent(true);
  }

  if (nothingToSay) return null;

  return (
    <Card>
      <View style={{ gap: space.sm }}>
        <Body bold>Confirm your email</Body>
        <Body tone="ink-2">
          {sent
            ? `Sent to ${email}. Open it on this phone and it brings you back here.`
            : `We sent a link to ${email} when you signed up. Until it is opened you can't join a trip you're invited to.`}
        </Body>
        {problem ? <Body tone="red">{problem}</Body> : null}
        <Button
          label={sent ? "Send it again" : "Resend the link"}
          variant="quiet"
          fit="small"
          busy={busy}
          onPress={resend}
        />
      </View>
    </Card>
  );
}
