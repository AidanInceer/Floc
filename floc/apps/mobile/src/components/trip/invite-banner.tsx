import { formatDateRange } from "@floc/core/dates/dates";
import { View } from "react-native";

import { Face } from "../system/face";
import { useTheme } from "../system/theme";
import type { AvatarIcon } from "@floc/core/people/avatar-icon";

import { Body, Button, Card } from "../system/ui";
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
      {invites.map((invite) => (
        <Card
          key={invite.tripId}
          style={{ backgroundColor: c["pastel-blue"], borderColor: c["pastel-blue-edge"], gap: space.md }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
            <Face name={invite.fromName} />
            <View style={{ flex: 1 }}>
              <Body bold>{invite.tripName}</Body>
              <Body tone="pastel-blue-ink">{invite.fromName} asked you</Body>
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
