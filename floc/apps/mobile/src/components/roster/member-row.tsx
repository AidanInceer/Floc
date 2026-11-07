import { Pressable, StyleSheet, Text, View } from "react-native";

import { MoreGlyph } from "@/components/system/glyphs";
import { useTheme } from "@/components/system/theme";
import { Face } from "@/components/trip/person-row";
import { fonts, size, space } from "@/lib/theme";

export function MemberRow({ name, avatarIcon, you, admin, word, first, onMore }: {
  name: string;
  avatarIcon: string | null;
  you: boolean;
  admin: boolean;
  /** Quiet status for somebody not on the roster yet — Invited, Declined. */
  word?: string;
  first: boolean;
  onMore?: () => void;
}) {
  const { c } = useTheme();
  const note = word ?? (admin ? "Admin" : null);
  const body = (
    <>
      <Face name={name} avatarIcon={avatarIcon} size={34} />
      <Text numberOfLines={1} style={{ flex: 1, color: word ? c["ink-3"] : c.ink, fontFamily: fonts.sansBold, fontSize: size.body }}>
        {name}
        {you ? <Text style={{ color: c["ink-3"], fontFamily: fonts.sans }}> (you)</Text> : null}
      </Text>
      {note ? <Text style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>{note}</Text> : null}
    </>
  );
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        minHeight: 56,
        paddingLeft: space.md,
        borderTopWidth: first ? 0 : StyleSheet.hairlineWidth,
        borderTopColor: c.rule,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={onMore ? `${name}. Options` : name}
        disabled={!onMore}
        onPress={onMore}
        style={({ pressed }) => ({ flex: 1, flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.sm, opacity: pressed ? 0.6 : 1 })}
      >
        {body}
      </Pressable>
      <View style={{ width: 44, alignItems: "center" }}>{onMore ? <MoreGlyph color={c["ink-3"]} /> : null}</View>
    </View>
  );
}
