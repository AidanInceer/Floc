/**
 * The card someone lands on when they open you (tickets 46, 201, 302).
 *
 * A PLAIN SHEET, NOT A PASTEL. The card carried the web's butter fill, but on
 * the phone it is the first thing under the title with nothing to contrast
 * against — so the colour read as a warning, not a welcome. The picture, the
 * name and the tags are enough to make it the page's subject.
 *
 * THE PEN MAKES IT A CONTROL. The name is edited from here, so the card has to
 * say it is touchable — the same mark the trip header carries, for the same
 * reason.
 *
 * INITIALS ARE NOT A FALLBACK, THEY ARE THE DEFAULT. Most people have no
 * picture set and never will; a broken-image slot for them would be a hole
 * where a face should be.
 */
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { PenGlyph } from "./glyphs";
import { useTheme } from "./theme";
import { fonts, radius, size, space } from "@/lib/theme";

const AVATAR = 60;

/** First letters of the first two words — "Aidan Inceer" is AI, "Ada" is A. */
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function Face({ name, url }: { name: string; url: string | null }) {
  const { c } = useTheme();
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        accessibilityIgnoresInvertColors
        style={{ width: AVATAR, height: AVATAR, borderRadius: radius.pill }}
      />
    );
  }
  return (
    <View
      style={{
        width: AVATAR,
        height: AVATAR,
        borderRadius: radius.pill,
        backgroundColor: c.peri,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: c["peri-edge"],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: c["peri-ink"],
          fontFamily: fonts.display,
          fontSize: size.heading,
        }}
      >
        {initials(name)}
      </Text>
    </View>
  );
}

export function ProfileFace({
  name,
  avatarUrl,
  been,
  wantToGo,
  vibeTags,
  onEdit,
}: {
  name: string;
  avatarUrl: string | null;
  been: number;
  wantToGo: number;
  vibeTags: string[];
  onEdit: () => void;
}) {
  const { c } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Edit your name — ${name}`}
      onPress={onEdit}
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
        <Face name={name} url={avatarUrl} />
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
    </Pressable>
  );
}
