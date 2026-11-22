import { ideaCategoryLabel } from "@floc/core/trip/idea-categories";
import { voteLabel, type IdeaRow } from "@floc/core/trip/ideas";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ArrowRightGlyph, MoreGlyph } from "../../system/glyphs";
import { useTheme } from "../../system/theme";
import { IconButton } from "../../system/ui";
import { IdeaTile } from "./idea-tile";
import { VotePill } from "./vote-pill";
import { fonts, size, space } from "@/lib/theme";

export function IdeaLine({
  idea,
  showCategory,
  onVote,
  onPlace,
  onMore,
}: {
  idea: IdeaRow;
  showCategory: boolean;
  onVote: () => void;
  onPlace: () => void;
  onMore: () => void;
}) {
  const { c } = useTheme();
  return (
    <View style={{ gap: space.sm, paddingVertical: space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <IdeaTile category={idea.category} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={2} style={{ color: c.ink, fontFamily: fonts.sansBold, fontSize: size.small }}>{idea.title}</Text>
          {showCategory ? <Text numberOfLines={1} style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.label }}>{ideaCategoryLabel(idea.category)}</Text> : null}
        </View>
        <IconButton label={`More for ${idea.title}`} onPress={onMore}>
          {(ink) => <MoreGlyph color={ink} />}
        </IconButton>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <VotePill
          votes={idea.votes}
          mine={idea.mine}
          label={`${idea.mine ? "Take back your vote for" : "Vote for"} ${idea.title} — ${voteLabel(idea.votes, idea.mine)}`}
          onPress={onVote}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add ${idea.title} to Days`}
          onPress={onPlace}
          hitSlop={6}
          style={({ pressed }) => ({ minHeight: 34, flexDirection: "row", alignItems: "center", gap: space.xs, paddingHorizontal: space.xs, marginRight: -space.xs, opacity: pressed ? 0.6 : 1 })}
        >
          <Text style={{ color: c["pen-deep"], fontFamily: fonts.sans, fontSize: size.small }}>Add to Days</Text>
          <ArrowRightGlyph color={c["pen-deep"]} />
        </Pressable>
      </View>
    </View>
  );
}
