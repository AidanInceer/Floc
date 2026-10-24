import { useQuery } from "@tanstack/react-query";
import { Share, Text, View } from "react-native";

import { useTheme } from "@/components/system/theme";
import { Body, Button, Card } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { fonts, size, space } from "@/lib/theme";

// The share sheet, like the invite link: it holds Copy and every mail app, with no native clipboard module.
export function InboxAddress({ tripId }: { tripId: number }) {
  const { c } = useTheme();
  const inbox = useQuery(trpc.files.inboxAddress.queryOptions({ tripId }, { enabled: Number.isFinite(tripId) }));
  const address = inbox.data;
  if (!address) return null;

  return (
    <Card>
      <Body tone="ink-3">Forward a booking email here. Its attachments land in Yours.</Body>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <Text
          selectable
          testID="files-inbox-address"
          style={{ flex: 1, color: c.ink, fontFamily: fonts.type, fontSize: size.small }}
        >
          {address}
        </Text>
        <Button
          label="Share"
          variant="quiet"
          fit="small"
          onPress={() => void Share.share({ message: address })}
        />
      </View>
    </Card>
  );
}
