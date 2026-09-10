/**
 * "Confirm your email" on You (#no-ticket; the web's invite-page gate, #149).
 *
 * WHY IT IS SAID AT ALL. The house rule is that the drawing carries the
 * meaning and text only says what layout cannot — and the two exceptions are
 * what is missing and what the status is. An unconfirmed address is both: it
 * is invisible until you try to join a trip and are refused.
 *
 * IT ASKS BETTER AUTH, NOT THE API. Resending is an auth operation on the
 * session's own account, so it goes through the same client that signed in.
 * That keeps it off the tRPC surface, which is about trips.
 *
 * IT NEVER DRAWS WHEN THE MAIL CANNOT GO. `canConfirmEmail` is false when the
 * host has no mail provider, and a permanent nag with no way to clear it is a
 * dead control with a sentence explaining why (rule 11).
 */
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
  /** False when the host has no mail provider. See the note above. */
  canConfirm: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  // The card owns whether it is drawn at all: You would otherwise carry two
  // more branches for a question that is entirely this card's.
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
