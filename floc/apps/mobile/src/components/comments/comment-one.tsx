/**
 * One comment, as the web draws it (event comments D): face, name and time, the words, then
 * Reply, the heart and — on your own — the dots. Edit and Delete live behind the dots, so a
 * row has one visible action.
 */
import type { Comment } from "@floc/api/port";
import { commentTime, likes } from "@floc/core/notes/notes";
import { whoTone, type WhoTone } from "@floc/core/people/who";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Face } from "../trip/person-row";
import { MoreGlyph, ReactionGlyph } from "../system/glyphs";
import { Sheet } from "../system/sheet";
import { useTheme } from "../system/theme";
import { Body, Button } from "../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

/** The trip colour the server sent, else the name's own, as `Face` would pick. */
function toneOf(comment: Comment): WhoTone {
  const tone = comment.authorTone;
  return tone && /^who-[1-8]$/.test(tone)
    ? (tone as WhoTone)
    : whoTone(comment.authorName);
}

function ReplyButton({ onPress }: { onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => ({
        height: 36,
        justifyContent: "center",
        paddingHorizontal: space.xs + 2,
        borderRadius: radius.sm,
        backgroundColor: pressed ? c["pen-2"] : "transparent",
      })}
    >
      <Text
        style={{
          color: c["ink-2"],
          fontFamily: fonts.sansBold,
          fontSize: size.small,
        }}
      >
        Reply
      </Text>
    </Pressable>
  );
}

function Heart({
  comment,
  onPress,
}: {
  comment: Comment;
  onPress: () => void;
}) {
  const { c } = useTheme();
  const { count, mine } = likes(comment);
  const ink = mine ? c.pen : c["ink-2"];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Like, ${count}`}
      accessibilityState={{ selected: mine }}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        height: 36,
        paddingHorizontal: space.sm + 2,
        borderRadius: radius.sm,
        backgroundColor: pressed ? c["pen-2"] : "transparent",
      })}
    >
      <ReactionGlyph kind="heart" mine={mine} color={ink} />
      {count ? (
        <Text
          style={{
            color: ink,
            fontFamily: fonts.type,
            fontSize: size.small,
            fontVariant: ["tabular-nums"],
          }}
        >
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}

function OwnActions({
  open,
  hasReplies,
  onEdit,
  onDelete,
  onClose,
}: {
  open: boolean;
  hasReplies: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [asking, setAsking] = useState(false);
  const close = () => {
    setAsking(false);
    onClose();
  };
  return (
    <Sheet open={open} onClose={close}>
      {/* Asks before it deletes, as the web does. */}
      <View style={{ paddingHorizontal: space.lg, gap: space.md }}>
        {asking ? (
          <>
            <Body bold>
              {hasReplies
                ? "Delete this comment? The replies to it go too."
                : "Delete this comment?"}
            </Body>
            <Button
              label="Delete it"
              variant="danger"
              onPress={() => {
                setAsking(false);
                onDelete();
              }}
            />
            <Button label="Cancel" variant="quiet" onPress={close} />
          </>
        ) : (
          <>
            <Button label="Edit" variant="quiet" onPress={onEdit} />
            <Button
              label="Delete"
              variant="danger"
              onPress={() => setAsking(true)}
            />
          </>
        )}
      </View>
    </Sheet>
  );
}

export function CommentOne({
  comment,
  mine,
  reply,
  hasReplies,
  onReply,
  onReact,
  onEdit,
  onDelete,
}: {
  comment: Comment;
  mine: boolean;
  reply?: boolean;
  hasReplies: boolean;
  onReply: () => void;
  onReact: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { c } = useTheme();
  const [actions, setActions] = useState(false);

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 11 }}>
      <Face
        name={comment.authorName}
        tone={toneOf(comment)}
        size={reply ? 24 : 30}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "baseline",
            columnGap: space.sm,
          }}
        >
          <Body bold>{comment.authorName}</Body>
          <Text
            style={{
              color: c["ink-3"],
              fontFamily: fonts.type,
              fontSize: size.small - 1,
            }}
          >
            {commentTime(new Date(comment.createdAt))}
          </Text>
          {comment.editedAt ? (
            <Text
              style={{
                color: c["ink-3"],
                fontFamily: fonts.type,
                fontSize: size.small - 1,
              }}
            >
              edited
            </Text>
          ) : null}
        </View>
        <Body>{comment.body}</Body>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginLeft: -space.xs,
          }}
        >
          <ReplyButton onPress={onReply} />
          <Heart comment={comment} onPress={onReact} />
          {mine ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="More for your comment"
              onPress={() => setActions(true)}
              hitSlop={4}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radius.sm,
                backgroundColor: pressed ? c["pen-2"] : "transparent",
              })}
            >
              <MoreGlyph color={c["ink-2"]} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {mine ? (
        <OwnActions
          open={actions}
          hasReplies={hasReplies}
          onClose={() => setActions(false)}
          onEdit={() => {
            setActions(false);
            onEdit();
          }}
          onDelete={() => {
            setActions(false);
            onDelete();
          }}
        />
      ) : null}
    </View>
  );
}
