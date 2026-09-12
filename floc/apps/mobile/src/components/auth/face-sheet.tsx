/**
 * Choose your icon (#157). The face on the profile card opens this; a tap on a
 * cell saves and closes.
 *
 * SAVES ON TAP, SO IT HOLDS NOTHING ELSE. The name stayed on the pen next to
 * it — a text field in here could not commit on tap without saving half a
 * name.
 *
 * NO COLOUR PICKER. The wash comes from the name hash, and choosing it would
 * break following one person across Money, Packing and the itinerary.
 */
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  AVATAR_ICONS,
  AVATAR_ICON_LABELS,
  type AvatarIcon,
} from "@floc/core/people/avatar-icon";

import { Sheet } from "../system/sheet";
import { AvatarIconMark } from "../system/avatar-icon";
import { useTheme } from "../system/theme";
import { Body } from "../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

const CELL = 48;

export function FaceSheet({
  open,
  initials,
  icon,
  onClose,
  onPick,
}: {
  open: boolean;
  initials: string;
  icon: AvatarIcon | null;
  onClose: () => void;
  onPick: (icon: AvatarIcon | null) => void;
}) {
  const { c } = useTheme();

  const cell = (option: AvatarIcon | null) => {
    const chosen = option === icon;
    return (
      <Pressable
        key={option ?? "initials"}
        accessibilityRole="button"
        accessibilityState={{ selected: chosen }}
        accessibilityLabel={option ? AVATAR_ICON_LABELS[option] : "Your initials"}
        testID={`face-${option ?? "initials"}`}
        onPress={() => {
          onPick(option);
          onClose();
        }}
        style={{
          width: CELL,
          height: CELL,
          borderRadius: radius.pill,
          backgroundColor: c["sheet-2"],
          borderWidth: chosen ? 2 : StyleSheet.hairlineWidth,
          borderColor: chosen ? c.pen : c.rule,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {option ? (
          <AvatarIconMark icon={option} color={c["ink-2"]} size={22} />
        ) : (
          <Text
            style={{ color: c["ink-2"], fontFamily: fonts.sansBold, fontSize: size.small }}
          >
            {initials}
          </Text>
        )}
      </Pressable>
    );
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <View style={{ padding: space.lg, gap: space.md }}>
        <Body>Choose your icon</Body>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: space.sm,
            justifyContent: "center",
          }}
        >
          {cell(null)}
          {AVATAR_ICONS.map((option) => cell(option))}
        </View>
      </View>
    </Sheet>
  );
}
