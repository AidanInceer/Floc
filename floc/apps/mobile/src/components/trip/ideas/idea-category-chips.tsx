import { IDEA_CATEGORY_MAX, type IdeaCategoryTab } from "@floc/core/trip/idea-categories";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { CrossGlyph, PlusGlyph } from "../../system/glyphs";
import { useTheme } from "../../system/theme";
import { Button, IconButton, TextBox } from "../../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

export function IdeaCategoryChips({
  tabs,
  tab,
  onPick,
  onMake,
}: {
  tabs: IdeaCategoryTab[];
  tab: string;
  onPick: (id: string) => void;
  onMake: (name: string) => void;
}) {
  const { c } = useTheme();
  const [making, setMaking] = useState(false);
  const [name, setName] = useState("");
  const finish = () => {
    setMaking(false);
    setName("");
  };
  const save = () => {
    if (!name.trim()) return;
    onMake(name);
    finish();
  };

  if (making) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <TextBox label="New category" value={name} onChangeText={setName} maxLength={IDEA_CATEGORY_MAX} autoFocus onSubmitEditing={save} />
        </View>
        <Button label="Add" fit="small" disabled={!name.trim()} onPress={save} />
        <IconButton label="Cancel new category" onPress={finish}>
          {(ink) => <CrossGlyph color={ink} />}
        </IconButton>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1, backgroundColor: c["sheet-3"], borderRadius: radius.sm }} contentContainerStyle={{ padding: 3, gap: 2 }}>
        {tabs.map((option) => {
          const on = option.id.toLowerCase() === tab.toLowerCase();
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${option.label}, ${option.count === 1 ? "1 idea" : `${option.count} ideas`}`}
              onPress={() => onPick(option.id)}
              style={{ minHeight: 34, justifyContent: "center", paddingHorizontal: space.md, borderRadius: radius.sm, backgroundColor: on ? c.sheet : "transparent" }}
            >
              <Text style={{ color: on ? c.ink : c["ink-2"], fontFamily: on ? fonts.sansBold : fonts.sans, fontSize: size.small }}>{option.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <IconButton label="Add a category" onPress={() => setMaking(true)}>
        {(ink) => <PlusGlyph color={ink} />}
      </IconButton>
    </View>
  );
}
