import { ALL_IDEAS, ideaCategoryLabel, type IdeaCategoryTab } from "@floc/core/trip/idea-categories";
import { TEXT_CAPS } from "@floc/core/text/text";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ChevronGlyph } from "../../system/glyphs";
import { useTheme } from "../../system/theme";
import { ChoiceSheet } from "../../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

export function IdeaAddBox({
  tab,
  tabs,
  busy,
  onAdd,
}: {
  tab: string;
  tabs: IdeaCategoryTab[];
  busy: boolean;
  onAdd: (title: string, category: string, done: () => void) => void;
}) {
  const { c } = useTheme();
  const [title, setTitle] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [choosing, setChoosing] = useState(false);
  const category = picked ?? (tab === ALL_IDEAS ? "other" : tab);
  const ready = title.trim().length > 0 && !busy;
  const submit = () => {
    if (!ready) return;
    onAdd(title.trim(), category, () => {
      setTitle("");
      setPicked(null);
    });
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "stretch", height: 42, borderWidth: StyleSheet.hairlineWidth, borderColor: c["rule-2"], borderRadius: radius.sm, backgroundColor: c.sheet, overflow: "hidden" }}>
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", paddingLeft: space.sm, gap: space.xs }}>
        <Text style={{ color: c["ink-2"], fontFamily: fonts.type, fontSize: size.label }}>NEW IDEA</Text>
        <TextInput
          accessibilityLabel="New idea"
          value={title}
          onChangeText={setTitle}
          maxLength={TEXT_CAPS.ideaTitle}
          autoCapitalize="sentences"
          returnKeyType="done"
          onSubmitEditing={submit}
          style={{ flex: 1, minWidth: 0, paddingVertical: 0, color: c.ink, fontFamily: fonts.type, fontSize: size.small }}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Category: ${ideaCategoryLabel(category)}`}
        onPress={() => setChoosing(true)}
        style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 2, maxWidth: 104, paddingHorizontal: space.sm, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: c.rule, opacity: pressed ? 0.6 : 1 })}
      >
        <Text numberOfLines={1} style={{ flexShrink: 1, color: c.ink, fontFamily: fonts.sans, fontSize: size.small }}>{ideaCategoryLabel(category)}</Text>
        <ChevronGlyph color={c["ink-2"]} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add idea"
        accessibilityState={{ disabled: !ready, busy }}
        disabled={!ready}
        onPress={submit}
        style={({ pressed }) => ({ justifyContent: "center", paddingHorizontal: space.md, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: c.rule, opacity: pressed ? 0.6 : 1 })}
      >
        <Text style={{ color: ready ? c["pen-deep"] : c["ink-3"], fontFamily: fonts.type, fontSize: size.label }}>{busy ? "ADD…" : "ADD"}</Text>
      </Pressable>
      <ChoiceSheet
        title="Category"
        open={choosing}
        onClose={() => setChoosing(false)}
        options={tabs.filter((t) => t.id !== ALL_IDEAS).map((t) => ({ value: t.id, label: t.label }))}
        value={category}
        onChange={setPicked}
      />
    </View>
  );
}
