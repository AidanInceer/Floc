/**
 * Your name and picture, in one sheet from the face card (#157, C3b).
 *
 * Why: name and picture save together, so a picture tap no longer commits on its own; the web's
 * popover holds the same two things. No colour picker — the wash comes from the name hash.
 */
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  AVATAR_ICONS,
  AVATAR_ICON_LABELS,
  type AvatarIcon,
} from "@floc/core/people/avatar-icon";
import { initials } from "@floc/core/people/initials";

import { Sheet } from "../system/sheet";
import { AvatarIconMark } from "../system/avatar-icon";
import { useTheme } from "../system/theme";
import { Body, Button, Field } from "../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

const CELL = 44;
const PER_ROW = 6;

function FaceGrid({
  name,
  picked,
  onPick,
}: {
  name: string;
  picked: AvatarIcon | null;
  onPick: (icon: AvatarIcon | null) => void;
}) {
  const { c } = useTheme();
  const options: (AvatarIcon | null)[] = [null, ...AVATAR_ICONS];
  const rows = Array.from(
    { length: Math.ceil(options.length / PER_ROW) },
    (_, i) => options.slice(i * PER_ROW, i * PER_ROW + PER_ROW),
  );
  return (
    <View style={{ gap: space.sm }}>
      {rows.map((row, r) => (
        <View
          key={r}
          style={{ flexDirection: "row", justifyContent: "space-between" }}
        >
          {row.map((option) => {
            const chosen = option === picked;
            return (
              <Pressable
                key={option ?? "initials"}
                accessibilityRole="button"
                accessibilityState={{ selected: chosen }}
                accessibilityLabel={
                  option ? AVATAR_ICON_LABELS[option] : "Your initials"
                }
                testID={`face-${option ?? "initials"}`}
                onPress={() => onPick(option)}
                style={{
                  width: CELL,
                  height: CELL,
                  borderRadius: radius.pill,
                  backgroundColor: chosen ? c.sheet : c["sheet-2"],
                  borderWidth: chosen ? 1.5 : StyleSheet.hairlineWidth,
                  borderColor: chosen ? c.ink : c.rule,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {option ? (
                  <AvatarIconMark
                    icon={option}
                    color={chosen ? c.ink : c["ink-2"]}
                    size={20}
                  />
                ) : (
                  <Text
                    style={{
                      color: chosen ? c.ink : c["ink-2"],
                      fontFamily: fonts.sansBold,
                      fontSize: size.small,
                    }}
                  >
                    {initials(name || "?")}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function FaceSheet({
  name,
  icon,
  busy,
  error,
  onClose,
  onSave,
}: {
  /** The starting values. Read once: the parent mounts this only while it is open. */
  name: string;
  icon: AvatarIcon | null;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (input: {
    displayName: string;
    avatarIcon: AvatarIcon | null;
  }) => void;
}) {
  const [draftName, setDraftName] = useState(name);
  const [draftIcon, setDraftIcon] = useState(icon);

  return (
    <Sheet open onClose={onClose}>
      <View style={{ padding: space.lg, gap: space.md }}>
        <Field
          label="Name"
          value={draftName}
          onChangeText={setDraftName}
          autoFocus
          testID="face-name"
        />
        {error ? <Body tone="red">{error}</Body> : null}
        <FaceGrid
          name={draftName.trim() || name}
          picked={draftIcon}
          onPick={setDraftIcon}
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: space.sm,
          }}
        >
          <Button
            label="Cancel"
            variant="quiet"
            fit="small"
            onPress={onClose}
          />
          <Button
            label="Save"
            fit="small"
            busy={busy}
            disabled={!draftName.trim()}
            onPress={() =>
              onSave({ displayName: draftName.trim(), avatarIcon: draftIcon })
            }
          />
        </View>
      </View>
    </Sheet>
  );
}
