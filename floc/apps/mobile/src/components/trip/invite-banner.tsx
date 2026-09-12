/**
 * Trips somebody has asked you onto (ticket 146), above your own list.
 *
 * IN-APP, NOT IN AN INBOX. A named invite sends no mail on either client — it
 * turns up the next time you look at your trips, which is where you were going
 * to decide anyway.
 *
 * ABOVE THE LIST, AND ONLY WHEN THERE IS ONE. It is the only thing on the
 * screen waiting on you; the ordinary state is that this draws nothing at all.
 * Peri, like Needs you, because it is the same kind of thing: a question for
 * you. "asked you" says so in words, so colour is never the only signal (#204).
 */
import { formatDateRange } from "@floc/core/dates/dates";
import { View } from "react-native";

import { Face } from "./person-row";
import { useTheme } from "../system/theme";
import type { AvatarIcon } from "@floc/core/people/avatar-icon";

import { Body, Button, Card, Label } from "../system/ui";
import { space } from "@/lib/theme";

export type Invitation = {
  tripId: number;
  tripName: string;
  startDate: string | null;
  endDate: string | null;
  fromName: string;
  fromAvatarIcon: AvatarIcon | null;
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
  const { c } = useTheme();
  if (invites.length === 0) return null;

  return (
    <View style={{ gap: space.sm }}>
      <Label>You have been asked</Label>
      {invites.map((invite) => (
        <Card
          key={invite.tripId}
          style={{ backgroundColor: c.peri, borderColor: c["peri-edge"], gap: space.md }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
            {/* Who asked leads — an invite from somebody you do not recognise
                is the one you want to decline. */}
            <Face name={invite.fromName} avatarIcon={invite.fromAvatarIcon} />
            <View style={{ flex: 1 }}>
              <Body bold>{invite.tripName}</Body>
              <Body tone="peri-ink">{invite.fromName} asked you</Body>
              <Body tone="ink-2">{formatDateRange(invite.startDate, invite.endDate)}</Body>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: space.sm }}>
            <View style={{ flex: 1 }}>
              <Button label="Join" busy={busy} onPress={() => onAnswer(invite.tripId, true)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label="No thanks"
                variant="quiet"
                busy={busy}
                onPress={() => onAnswer(invite.tripId, false)}
              />
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}
