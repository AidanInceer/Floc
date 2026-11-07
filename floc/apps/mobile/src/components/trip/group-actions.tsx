/**
 * Why two named doors: "Share trip" and "Invite friends" read as one job. The link goes anywhere
 * through the system sheet; the friends list adds people already on Floc. Any member may do both (#312).
 */
import { Share, View } from "react-native";

import { ShareGlyph } from "../system/glyphs";
import { Button, Divider } from "../system/ui";
import { space } from "@/lib/theme";

export function GroupActions({
  link,
  onInvite,
}: {
  /** The share link, or null while it loads. */
  link: string | null;
  onInvite: () => void;
}) {
  return (
    <View style={{ gap: space.md }}>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "flex-start",
          gap: space.sm,
        }}
      >
        <Button
          label="Share trip"
          variant="quiet"
          fit="small"
          icon={(ink) => <ShareGlyph color={ink} />}
          disabled={link === null}
          onPress={() => {
            if (link) void Share.share({ message: link });
          }}
        />
        <Button label="Invite friends" variant="quiet" fit="small" onPress={onInvite} />
      </View>
      <Divider />
    </View>
  );
}
