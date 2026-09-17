/**
 * Why: open while the dates are unset, shut once they are set. The header row
 * stays either way, so a decided trip keeps its ideas without spending a
 * screen on them.
 */
import { whoTone } from "@floc/core/people/who";
import { sortIdeas, voteLabel, type IdeaRow, type IdeaSort } from "@floc/core/trip/ideas";
import { commentTime } from "@floc/core/notes/notes";
import { Pressable, StyleSheet, View } from "react-native";

import { ChevronGlyph, CrossGlyph, Seat } from "../../system/glyphs";
import { useTheme } from "../../system/theme";
import { Body, Card, IconButton, Label, Segmented } from "../../system/ui";
import { VotePill } from "./vote-pill";
import { radius, space } from "@/lib/theme";

export type IdeaCard = IdeaRow & { createdAt: Date };

export function IdeasPanel({
  ideas,
  open,
  sort,
  onToggle,
  onSort,
  onVote,
  onRemove,
  children,
}: {
  ideas: IdeaCard[];
  open: boolean;
  sort: IdeaSort;
  onToggle: () => void;
  onSort: (sort: IdeaSort) => void;
  onVote: (ideaId: number) => void;
  onRemove: (ideaId: number) => void;
  /** The add box, drawn by the screen that owns the mutation. */
  children: React.ReactNode;
}) {
  const { c } = useTheme();

  return (
    <View style={{ gap: space.sm }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`Ideas, ${ideas.length === 1 ? "1 idea" : `${ideas.length} ideas`}`}
        onPress={onToggle}
        style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}
      >
        <Label>Ideas</Label>
        {ideas.length > 0 ? <Label>{ideas.length}</Label> : null}
        <View style={{ flex: 1 }} />
        <View style={open ? undefined : { transform: [{ rotate: "-90deg" }] }}>
          <ChevronGlyph color={c["ink-2"]} />
        </View>
      </Pressable>

      {open ? (
        <Card>
          {children}
          {ideas.length > 1 ? (
            <Segmented
              value={sort}
              onChange={onSort}
              options={[
                { value: "votes", label: "Most votes" },
                { value: "newest", label: "Newest" },
              ]}
            />
          ) : null}
          {ideas.length === 0 ? (
            <Body tone="ink-2">No ideas yet. Put the first one up and let the group vote.</Body>
          ) : (
            sortIdeas(ideas, sort).map((idea) => (
              <View
                key={idea.id}
                style={{
                  gap: space.sm,
                  backgroundColor: c["sheet-2"],
                  borderRadius: radius.md,
                  padding: space.md,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: c.rule,
                }}
              >
                <Body>{idea.title}</Body>
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                  <Seat
                    initial={idea.authorName.slice(0, 1).toUpperCase()}
                    ground={c[whoTone(idea.authorName)]}
                    ink={c[`${whoTone(idea.authorName)}-ink`]}
                  />
                  <View style={{ flex: 1 }}>
                    <Label>{`${idea.authorName} · ${commentTime(idea.createdAt)}`}</Label>
                  </View>
                  <VotePill
                    votes={idea.votes}
                    mine={idea.mine}
                    label={`${idea.mine ? "Take back your vote for" : "Vote for"} ${idea.title} — ${voteLabel(idea.votes, idea.mine)}`}
                    onPress={() => onVote(idea.id)}
                  />
                  <IconButton
                    label={`Remove ${idea.title}`}
                    tone="danger"
                    onPress={() => onRemove(idea.id)}
                  >
                    {(ink) => <CrossGlyph color={ink} />}
                  </IconButton>
                </View>
              </View>
            ))
          )}
        </Card>
      ) : null}
    </View>
  );
}
