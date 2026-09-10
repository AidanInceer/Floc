/**
 * Trips somebody has asked you onto (ticket 146), above your own list.
 *
 * IN-APP, NOT IN AN INBOX. A named invite sends no mail on either client — it
 * turns up the next time you look at your trips, which is where you were going
 * to decide anyway.
 *
 * ABOVE THE LIST, AND ONLY WHEN THERE IS ONE. It is the only thing on the
 * screen waiting on you; the ordinary state is that this draws nothing at all.
 */
import { formatDateRange } from "@floc/core/dates";
import { View } from "react-native";

import { PersonRow } from "./person-row";
import { Body, Button, Card, Label } from "../system/ui";
import { space } from "@/lib/theme";

export type Invitation = {
  tripId: number;
  tripName: string;
  startDate: string | null;
  endDate: string | null;
  fromName: string;
  fromAvatarUrl: string | null;
};

export function InviteBanner({
  invites,
  busy,
  onAnswer,
}: {
  invites: Invitation[];
  busy: boolean;
  onAnswer: (tripId: number, join: boolean) => void;
}) {
  if (invites.length === 0) return null;

  return (
    <View style={{ gap: space.sm }}>
      <Label>You have been asked</Label>
      {invites.map((invite) => (
        <Card key={invite.tripId}>
          <Body bold>{invite.tripName}</Body>
          <Body tone="ink-2">{formatDateRange(invite.startDate, invite.endDate)}</Body>
          {/* Who asked matters more than when — an invite from somebody you do
              not recognise is the one you want to decline. */}
          <PersonRow name={invite.fromName} avatarUrl={invite.fromAvatarUrl} caption="asked you" />
          <Button label="Join" busy={busy} onPress={() => onAnswer(invite.tripId, true)} />
          <Button
            label="No thanks"
            variant="quiet"
            busy={busy}
            onPress={() => onAnswer(invite.tripId, false)}
          />
        </Card>
      ))}
    </View>
  );
}
