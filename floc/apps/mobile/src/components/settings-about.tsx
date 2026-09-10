/**
 * About you — vibe tags and dietary (tickets 46, 236, on the phone).
 *
 * TAGS ARE PICKED, NOT TYPED. The seed list is short enough to lay out whole,
 * so there is no picker sheet and no search: ten pills, tap to turn one on.
 * Tapping is the write.
 *
 * DIETARY IS NEVER ON YOUR PROFILE. It surfaces where it does work — a trip
 * deciding where to eat — which is the one thing the layout cannot say, so it
 * is the one line of text here.
 *
 * THE NOTE SAVES WHEN YOU LEAVE IT. Free text is the only control on this
 * screen that cannot save per keystroke, so it saves on blur rather than
 * growing the screen's only Save button.
 */
import { DIET_FLAGS, MAX_DIETARY_NOTES } from "@floc/core/dietary";
import { VIBE_TAGS } from "@floc/core/vibe-tags";
import { StyleSheet, Pressable, Text, View } from "react-native";

import { useTheme } from "./theme";
import { Body, Field, Label, Toggle } from "./ui";
import { fonts, radius, size, space } from "@/lib/theme";

export type Dietary = { flags: string[]; notes: string; share: boolean };

/** One tag, on or off. Filled when on, and the word is always there (#204). */
function TagPill({
  tag,
  on,
  onPress,
}: {
  tag: string;
  on: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={tag}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: on ? c.peri : c.sheet,
        borderColor: on ? c["peri-edge"] : c.rule,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.pill,
        paddingVertical: space.xs,
        paddingHorizontal: space.md,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          color: on ? c["peri-ink"] : c["ink-2"],
          fontFamily: on ? fonts.sansBold : fonts.sans,
          fontSize: size.small,
        }}
      >
        {tag}
      </Text>
    </Pressable>
  );
}

export function SettingsVibeTags({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <View style={{ gap: space.sm }}>
      <Label>Vibe tags</Label>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs }}>
        {VIBE_TAGS.map((tag) => (
          <TagPill
            key={tag}
            tag={tag}
            on={tags.includes(tag)}
            onPress={() =>
              onChange(tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag])
            }
          />
        ))}
      </View>
    </View>
  );
}

export function SettingsDietary({
  dietary,
  onChange,
  onCommitNotes,
}: {
  dietary: Dietary;
  /** Fires on every switch — a switch is the answer, so it is the write. */
  onChange: (next: Dietary) => void;
  /** Fires when the free text loses focus, which is the only moment it is finished. */
  onCommitNotes: () => void;
}) {
  return (
    <View style={{ gap: space.sm }}>
      <Label>Dietary</Label>
      <Body tone="ink-3">
        Never on your profile. It shows up on a trip working out where to eat.
      </Body>

      {Object.entries(DIET_FLAGS).map(([value, label]) => (
        <Toggle
          key={value}
          label={label}
          value={dietary.flags.includes(value)}
          onChange={(on) =>
            onChange({
              ...dietary,
              flags: on
                ? [...dietary.flags, value]
                : dietary.flags.filter((f) => f !== value),
            })
          }
        />
      ))}

      <Field
        label="Allergies and intolerances"
        value={dietary.notes}
        maxLength={MAX_DIETARY_NOTES}
        multiline
        onChangeText={(notes) => onChange({ ...dietary, notes })}
        onBlur={onCommitNotes}
      />

      <Toggle
        label="Share this with people I'm on a trip with"
        hint="All of it or none of it — the diets and the free text move together."
        value={dietary.share}
        onChange={(share) => onChange({ ...dietary, share })}
      />
    </View>
  );
}
