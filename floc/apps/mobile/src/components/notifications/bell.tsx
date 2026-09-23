/**
 * The top bar's bell (#344): the same count the web bar shows, and the way
 * into the inbox.
 *
 * ITS OWN FILE BECAUSE EXPLORE HAS ITS OWN STACK. The tab layout sets this as
 * `headerRight` for every tab, but Explore hides that header and draws its
 * own — so the bell vanished on one tab out of three.
 */
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Pressable, Text } from "react-native";

import { BellGlyph } from "@/components/system/glyphs";
import { useTheme } from "@/components/system/theme";
import { trpc } from "@/lib/api";
import { fonts, size, space } from "@/lib/theme";

export function Bell() {
  const { c } = useTheme();
  const router = useRouter();
  const unread = useQuery(trpc.notifications.unread.queryOptions()).data ?? 0;
  const shown = unread > 99 ? "99+" : String(unread);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={unread ? `Notifications, ${shown} unread` : "Notifications"}
      onPress={() => router.push("/inbox")}
      hitSlop={8}
      style={{ flexDirection: "row", alignItems: "center", gap: space.xs, marginRight: space.lg }}
    >
      <BellGlyph color={c.ink} />
      {unread ? (
        <Text
          style={{
            minWidth: 17,
            paddingHorizontal: 4,
            borderRadius: 9,
            overflow: "hidden",
            textAlign: "center",
            backgroundColor: c.pen,
            color: c.sheet,
            fontFamily: fonts.type,
            fontSize: size.label,
          }}
        >
          {shown}
        </Text>
      ) : null}
    </Pressable>
  );
}
