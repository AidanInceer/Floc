/**
 * What is outstanding on a trip, and the one thing to do about it (ticket 296).
 *
 * EVERY ITEM IS DERIVED. There is no notification table, no read flag and no
 * dismiss — a trip has no lifecycle state (rule 4), so an item is present
 * exactly while the fact that produced it is true, and disappears the moment
 * it stops being true. Nothing here is stored, which is also why nothing here
 * can go stale or be dismissed into a lie.
 *
 * The card is peri, and every row carries its words. Colour is never the
 * thing that says something needs you (#204).
 */
import { Pressable, StyleSheet, View } from "react-native";

import { useTheme } from "../system/theme";
import { Body, Label } from "../system/ui";
import { space, radius } from "@/lib/theme";

export type Outstanding = {
  /** Stable within a render, and only used as a key — never persisted. */
  id: string;
  /** The fact, in words. "No dates set yet." */
  said: string;
  /** The one thing to do about it. "Set them". */
  action: string;
  onPress: () => void;
};

export function NeedsYou({ items }: { items: Outstanding[] }) {
  const { c } = useTheme();

  // Nothing outstanding is not an empty state to apologise for — it is the
  // answer, so the card simply is not there.
  if (items.length === 0) return null;

  return (
    <View style={{ gap: space.sm }}>
      <Label>Needs you</Label>
      <View
        style={{
          backgroundColor: c.peri,
          borderColor: c["peri-edge"],
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: radius.lg,
          overflow: "hidden",
        }}
      >
        {items.map((item, index) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`${item.said} ${item.action}`}
            onPress={item.onPress}
            style={({ pressed }) => ({
              padding: space.lg,
              gap: space.xs,
              alignItems: "center",
              opacity: pressed ? 0.7 : 1,
              borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
              borderTopColor: c["peri-edge"],
            })}
          >
            <Body>{item.said}</Body>
            <Body bold tone="peri-ink">
              {item.action}
            </Body>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
