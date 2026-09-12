/**
 * The card someone lands on when they open you (tickets 46, 201, 302).
 *
 * A PLAIN SHEET, NOT A PASTEL. The card carried the web's butter fill, but on
 * the phone it is the first thing under the title with nothing to contrast
 * against — so the colour read as a warning, not a welcome. The picture, the
 * name and the tags are enough to make it the page's subject.
 *
 * TWO TARGETS, NOT ONE (#157). The face opens the picker and the pen opens the
 * name, because one Pressable cannot mean both once the picture became a
 * choice rather than a text field.
 *
 * INITIALS ARE NOT A FALLBACK, THEY ARE THE DEFAULT. Most people have no
 * picture set and never will; a broken-image slot for them would be a hole
 * where a face should be.
 */
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import { whoTone } from "@floc/core/people/who";

import { AvatarIconMark } from "./avatar-icon";
import { PenGlyph } from "./glyphs";
import { useTheme } from "./theme";
import { fonts, radius, size, space } from "@/lib/theme";

const AVATAR = 60;

/** First letters of the first two words — "Aidan Inceer" is AI, "Ada" is A. */
export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function Face({ name, icon }: { name: string; icon: AvatarIcon | null }) {
  const { c } = useTheme();
  // Hardcoded peri until #157: the card was the one place a person was not
  // their own colour, so you were a different person here than on the roster.
  const tone = whoTone(name);
  return (
    <View
      style={{
        width: AVATAR,
        height: AVATAR,
        borderRadius: radius.pill,
        backgroundColor: c[tone],
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: c[`${tone}-ink`],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon ? (
        <AvatarIconMark icon={icon} color={c[`${tone}-ink`]} size={30} />
      ) : (
        <Text
          style={{
            color: c[`${tone}-ink`],
            fontFamily: fonts.display,
            fontSize: size.heading,
          }}
        >
          {initialsOf(name)}
        </Text>
      )}
    </View>
  );
}

export function ProfileFace({
  name,
  avatarIcon,
  been,
  wantToGo,
  vibeTags,
  onEditName,
  onEditFace,
}: {
  name: string;
  avatarIcon: AvatarIcon | null;
  been: number;
  wantToGo: number;
  vibeTags: string[];
  onEditName: () => void;
  onEditFace: () => void;
}) {
  const { c } = useTheme();

  return (
    <View
      style={{
        backgroundColor: c.sheet,
        borderColor: c.rule,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.lg,
        padding: space.lg,
        gap: space.md,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change your picture"
          testID="edit-face"
          onPress={onEditFace}
        >
          <Face name={name} icon={avatarIcon} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit your name — ${name}`}
          testID="edit-name"
          onPress={onEditName}
          style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: space.md }}
        >
        <View style={{ flex: 1, gap: space.xs }}>
          <Text
            numberOfLines={1}
            style={{
              color: c.ink,
              fontFamily: fonts.display,
              fontSize: size.heading,
            }}
          >
            {name}
          </Text>
          <Text
            style={{
              color: c["ink-3"],
              fontFamily: fonts.type,
              fontSize: size.small,
              fontVariant: ["tabular-nums"],
            }}
          >
            {been} been · {wantToGo} want to go
          </Text>
        </View>
        <PenGlyph color={c["ink-3"]} />
        </Pressable>
      </View>

      {vibeTags.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs }}>
          {vibeTags.map((tag) => (
            <View
              key={tag}
              style={{
                backgroundColor: c.paper,
                borderColor: c.rule,
                borderWidth: StyleSheet.hairlineWidth,
                borderRadius: radius.pill,
                paddingVertical: 2,
                paddingHorizontal: space.sm,
              }}
            >
              <Text style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small }}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
