/**
 * The bar that appears while you are picking rows (ticket 229).
 *
 * PINNED, NOT IN THE FLOW. What you picked is at the top of a long list and
 * the press to act on it must not be at the bottom of one — so it sits over
 * the screen while picking and is gone the rest of the time.
 *
 * IT SAYS THE NUMBER. "Remove" alone, over a list you have scrolled away from,
 * does not tell you what is about to go.
 *
 */
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../system/theme";
import { Body, Button } from "../system/ui";
import { space } from "@/lib/theme";

export function PackingBulkBar({
  listName,
  picked,
  busy,
  onRemove,
  onDone,
}: {
  /** Named, so the wrong list cannot be emptied by accident. */
  listName: string;
  picked: number;
  busy: boolean;
  onRemove: () => void;
  onDone: () => void;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: insets.bottom + space.sm,
        paddingTop: space.md,
        paddingHorizontal: space.lg,
        gap: space.sm,
        backgroundColor: c.sheet,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: c.rule,
      }}
    >
      <Body tone="ink-2">
        {listName} — {picked === 0 ? "nothing picked" : `${picked} picked`}
      </Body>
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <Button
            label={picked === 0 ? "Remove" : `Remove ${picked}`}
            variant="danger"
            disabled={picked === 0}
            busy={busy}
            onPress={onRemove}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Done" variant="quiet" onPress={onDone} />
        </View>
      </View>
    </View>
  );
}
