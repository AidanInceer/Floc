import { useQuery } from "@tanstack/react-query";
import { Pressable, Share, Text, View } from "react-native";

import { ShareGlyph } from "@/components/system/glyphs";
import { useTheme } from "@/components/system/theme";
import { Card } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { fonts, size, space } from "@/lib/theme";

// Why: the share sheet holds Copy and every mail app, with no native clipboard module (as the invite link).
export function InboxAddress({ tripId }: { tripId: number }) {
  const { c } = useTheme();
  const inbox = useQuery(trpc.files.inboxAddress.queryOptions({ tripId }, { enabled: Number.isFinite(tripId) }));
  const address = inbox.data;
  if (!address) return null;

  return (
    <Card style={{ flexDirection: "row", alignItems: "center", gap: space.md, paddingRight: space.sm }}>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>
          Forward a booking email here. Its attachments land in Yours.
        </Text>
        <Text
          numberOfLines={2}
          accessibilityLabel={address}
          testID="files-inbox-address"
          style={{ color: c.ink, fontFamily: fonts.type, fontSize: size.small }}
        >
          {address}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Share the address"
        onPress={() => void Share.share({ message: address })}
        hitSlop={4}
        style={({ pressed }) => ({
          minHeight: 44,
          flexDirection: "row",
          alignItems: "center",
          gap: space.xs,
          paddingHorizontal: space.sm,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <ShareGlyph color={c.pen} />
        <Text style={{ color: c.pen, fontFamily: fonts.sansBold, fontSize: size.small }}>Share</Text>
      </Pressable>
    </Card>
  );
}
