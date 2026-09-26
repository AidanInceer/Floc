import { viewPackingLines, type PackCategory } from "@floc/core/packing/packing";
import { useState } from "react";
import { Alert, Pressable, View } from "react-native";

import { CrossGlyph, MinusGlyph, PlusGlyph } from "../system/glyphs";
import { Body, Button, Card, Empty, Field, Figure, IconButton, Label } from "../system/ui";
import { space } from "@/lib/theme";

export type KitItem = {
  id: number;
  label: string;
  category: PackCategory;
  quantity: number;
};

export type SavedKit = { id: number; name: string; items: KitItem[] };

export function KitCard({
  kit,
  busy,
  onRename,
  onAdd,
  onDelete,
  onStepItem,
  onRemoveItem,
}: {
  kit: SavedKit;
  busy: boolean;
  onRename: (name: string) => void;
  onAdd: () => void;
  onDelete: () => void;
  onStepItem: (itemId: number, delta: 1 | -1) => void;
  onRemoveItem: (itemId: number) => void;
}) {
  const [name, setName] = useState<string | null>(null);
  const groups = viewPackingLines(kit.items, { sort: "category", category: "all" });

  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        {name === null ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Rename ${kit.name}`}
            onPress={() => setName(kit.name)}
            style={{ flex: 1 }}
          >
            <Body bold>{kit.name}</Body>
            <Label>{kit.items.length === 1 ? "1 thing" : `${kit.items.length} things`}</Label>
          </Pressable>
        ) : (
          <View style={{ flex: 1 }}>
            <Field
              label="List name"
              value={name}
              autoFocus
              onChangeText={setName}
              onBlur={() => {
                const next = name.trim();
                if (next && next !== kit.name) onRename(next);
                setName(null);
              }}
            />
          </View>
        )}
        <IconButton
          label={`Delete ${kit.name}`}
          tone="danger"
          disabled={busy}
          onPress={() =>
            Alert.alert(
              `Delete "${kit.name}"?`,
              "Bags you've already filled from it keep their things.",
              [
                { text: "Keep it", style: "cancel" },
                { text: "Delete it", style: "destructive", onPress: onDelete },
              ],
            )
          }
        >
          {(color) => <CrossGlyph color={color} />}
        </IconButton>
      </View>

      <Button label="Add something" variant="quiet" disabled={busy} onPress={onAdd} />

      {groups.length === 0 ? <Empty>Nothing in it yet.</Empty> : null}
      {groups.map((group) => (
        <Card key={group.key}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Label>{group.heading ?? "All items"}</Label>
            <Label>{group.lines.length === 1 ? "1 thing" : `${group.lines.length} things`}</Label>
          </View>
          {group.lines.map((item) => (
            <View
              key={item.id}
              style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}
            >
              <View style={{ flex: 1 }}>
                <Body>{item.label}</Body>
              </View>
              <IconButton
                label={`One fewer ${item.label}`}
                disabled={busy || item.quantity <= 1}
                onPress={() => onStepItem(item.id, -1)}
              >
                {(color) => <MinusGlyph color={color} />}
              </IconButton>
              <Figure>{item.quantity}</Figure>
              <IconButton
                label={`One more ${item.label}`}
                disabled={busy}
                onPress={() => onStepItem(item.id, 1)}
              >
                {(color) => <PlusGlyph color={color} />}
              </IconButton>
              <IconButton
                label={`Remove ${item.label}`}
                tone="danger"
                disabled={busy}
                onPress={() => onRemoveItem(item.id)}
              >
                {(color) => <CrossGlyph color={color} />}
              </IconButton>
            </View>
          ))}
        </Card>
      ))}
    </View>
  );
}
