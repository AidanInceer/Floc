/**
 * The two ways onto a trip, on the group itself (#no-ticket).
 *
 * SAME TWO THE WEB HAS, SAME PLACE. `trip-roster.tsx` puts "Invite friends"
 * and "Share trip" under "The group" heading, and says why sharing is not in
 * the trip menu: one job, one door. The phone had them behind a glyph in the
 * header, which was a second door and the less findable one — so the glyph
 * went and these arrived where the people are listed.
 *
 * SHARE IS THE SYSTEM SHEET, NOT A COPY BUTTON. A browser has nowhere to send
 * a link, so the web copies it. A phone has WhatsApp, Messages and everything
 * else one tap away, and asking someone to copy and then go and find the app
 * is a browser's habit on a device that does not need it.
 *
 * ANY MEMBER (#312). Inviting is not an admin power.
 *
 * SHAPED LIKE THE WEB'S. Two controls sized to their words, secondary then
 * primary, with a rule under them and the people below it — the panel reads
 * the same on both. Half-width halves made two rare controls the heaviest
 * thing on the card.
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
          justifyContent: "center",
          gap: space.sm,
        }}
      >
        <Button label="Invite friends" variant="quiet" fit="small" onPress={onInvite} />
        <Button
          label="Share trip"
          fit="small"
          icon={(ink) => <ShareGlyph color={ink} />}
          disabled={link === null}
          onPress={() => {
            if (link) void Share.share({ message: link });
          }}
        />
      </View>
      <Divider />
    </View>
  );
}
