/**
 * Talk about one event, on a phone (ticket 325).
 *
 * ONE LEVEL DEEP, LIKE THE WEB'S. A reply to a reply attaches to the same
 * parent — the server decides that, not this file — so a run is a comment and
 * a flat list under it. Nothing here recurses.
 *
 * CUT BACK FROM THE WEB'S. No sort control and no avatars: a run in a modal on
 * a phone is a handful of lines, and both of those cost a row each to organise
 * something that fits on the screen already. Reactions stay, because they are
 * how most people answer without typing.
 *
 * A REACTION IS THE WEB'S OWN GLYPH AND A COUNT. Words read as three buttons
 * competing with Reply and Edit; the drawing is the same one the browser makes,
 * so one reaction is one picture on both surfaces. The count carries the state,
 * never the fill alone (#204) — and the action is still said aloud.
 *
 * THE CHIP IS A FIXED SIZE. The count slot is always there, empty or not: let
 * it size to its content and every chip jumps wider the moment it is pressed,
 * shoving the two beside it along with it (#325 feedback).
 *
 * REFUSALS ARE SENTENCES. An empty body and a comment that has gone are
 * ordinary mistakes; they read under the composer rather than crashing it.
 */
import type { Comment } from "@floc/api/port";
import { commentTime } from "@floc/core/notes/notes";
import { REACTION_KINDS, type ReactionKind } from "@floc/core/vocabulary";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ReactionGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { Body, Button, Field, Figure } from "../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

/** Room for two digits, so going from 9 to 10 does not move the chip either. */
const COUNT_WIDTH = 13;

/** Set, not padding-derived — the count glyph and the drawing are different heights. */
const CHIP_HEIGHT = 24;

const REACTION_LABEL: Record<ReactionKind, string> = {
  heart: "Love",
  up: "Agree",
  down: "Disagree",
};

export type ThreadActions = {
  /** Null `replyTo` starts a run. */
  onAdd: (replyTo: number | null, body: string) => void;
  onEdit: (commentId: number, body: string) => void;
  onDelete: (commentId: number) => void;
  onReact: (commentId: number, kind: ReactionKind) => void;
};

function Reactions({
  comment,
  onReact,
}: {
  comment: Comment;
  onReact: (kind: ReactionKind) => void;
}) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: space.xs }}>
      {REACTION_KINDS.map((kind) => {
        const { count, mine } = comment.reactions[kind];
        return (
          <Pressable
            key={kind}
            accessibilityRole="button"
            accessibilityState={{ selected: mine }}
            accessibilityLabel={`${REACTION_LABEL[kind]} · ${count}`}
            onPress={() => onReact(kind)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: space.xs,
              height: CHIP_HEIGHT,
              borderWidth: 1,
              borderColor: mine ? c["peri-edge"] : c.rule,
              backgroundColor: mine ? c.peri : "transparent",
              borderRadius: radius.pill,
              paddingHorizontal: space.sm,
            }}
          >
            <ReactionGlyph
              kind={kind}
              mine={mine}
              color={mine ? c["peri-ink"] : c["ink-2"]}
            />
            <Text
              numberOfLines={1}
              style={{
                width: COUNT_WIDTH,
                color: mine ? c["peri-ink"] : c["ink-2"],
                fontFamily: fonts.type,
                fontSize: size.small,
                fontVariant: ["tabular-nums"],
              }}
            >
              {count > 0 ? count : ""}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Composer({
  label,
  busy,
  initial,
  onSend,
  onCancel,
}: {
  label: string;
  busy: boolean;
  initial?: string;
  onSend: (body: string) => void;
  onCancel: () => void;
}) {
  const [body, setBody] = useState(initial ?? "");
  return (
    <View style={{ gap: space.sm }}>
      <Field label={label} value={body} onChangeText={setBody} multiline autoFocus />
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <Button label="Cancel" variant="quiet" onPress={onCancel} />
        </View>
        <View style={{ flex: 2 }}>
          <Button
            label="Post"
            busy={busy}
            onPress={() => {
              const said = body.trim();
              if (said) onSend(said);
            }}
          />
        </View>
      </View>
    </View>
  );
}

/** Nothing open, answering a run, or rewriting your own. One state, so two cannot both be true. */
type Open = { kind: "none" } | { kind: "reply"; id: number } | { kind: "edit"; id: number };

function One({
  comment,
  viewerId,
  busy,
  open,
  setOpen,
  actions,
  /** A reply has no reply button of its own — the thread is one level deep. */
  canReply,
}: {
  comment: Comment;
  viewerId: string;
  busy: boolean;
  open: Open;
  setOpen: (next: Open) => void;
  actions: ThreadActions;
  canReply: boolean;
}) {
  const { c } = useTheme();
  const mine = comment.createdBy === viewerId;

  if (open.kind === "edit" && open.id === comment.id) {
    return (
      <Composer
        label="Rewrite it"
        busy={busy}
        initial={comment.body}
        onSend={(body) => actions.onEdit(comment.id, body)}
        onCancel={() => setOpen({ kind: "none" })}
      />
    );
  }

  return (
    <View style={{ gap: space.xs }}>
      <Figure tone="ink-2">
        {mine ? "You" : comment.authorName} · {commentTime(new Date(comment.createdAt))}
        {comment.editedAt ? " · edited" : ""}
      </Figure>
      <Body>{comment.body}</Body>

      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <Reactions comment={comment} onReact={(kind) => actions.onReact(comment.id, kind)} />
        {/* The reactions lead and the actions sit at the far edge: they are
            what you do to the comment, not another thing to say about it. */}
        <View style={{ flex: 1 }} />
        {canReply ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setOpen({ kind: "reply", id: comment.id })}
          >
            <Figure tone="pen">Reply</Figure>
          </Pressable>
        ) : null}
        {mine ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setOpen({ kind: "edit", id: comment.id })}
          >
            <Figure tone="pen">Edit</Figure>
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" onPress={() => actions.onDelete(comment.id)}>
          <Figure tone="ink-3">Delete</Figure>
        </Pressable>
      </View>

      {comment.replies.length > 0 ? (
        <View
          style={{
            gap: space.md,
            marginTop: space.xs,
            paddingLeft: space.md,
            borderLeftWidth: StyleSheet.hairlineWidth,
            borderLeftColor: c.rule,
          }}
        >
          {comment.replies.map((reply) => (
            <One
              key={reply.id}
              comment={reply}
              viewerId={viewerId}
              busy={busy}
              open={open}
              setOpen={setOpen}
              actions={actions}
              canReply={false}
            />
          ))}
        </View>
      ) : null}

      {open.kind === "reply" && open.id === comment.id ? (
        <Composer
          label="Answer this"
          busy={busy}
          onSend={(body) => actions.onAdd(comment.id, body)}
          onCancel={() => setOpen({ kind: "none" })}
        />
      ) : null}
    </View>
  );
}

export function CommentThread({
  comments,
  viewerId,
  busy,
  problem,
  actions,
}: {
  comments: Comment[];
  viewerId: string;
  busy: boolean;
  problem: string | null;
  actions: ThreadActions;
}) {
  const [open, setOpen] = useState<Open>({ kind: "none" });
  const [starting, setStarting] = useState(false);

  // Anything the thread did closes every composer: a reply that has landed is
  // not still being written, and a stale box invites it to be sent twice.
  const settle = () => {
    setOpen({ kind: "none" });
    setStarting(false);
  };

  return (
    <View style={{ gap: space.md }}>
      {comments.length === 0 ? (
        <Body tone="ink-3">Nothing said about this yet.</Body>
      ) : (
        comments.map((comment) => (
          <One
            key={comment.id}
            comment={comment}
            viewerId={viewerId}
            busy={busy}
            open={open}
            setOpen={setOpen}
            actions={{
              onAdd: (replyTo, body) => {
                actions.onAdd(replyTo, body);
                settle();
              },
              onEdit: (id, body) => {
                actions.onEdit(id, body);
                settle();
              },
              onDelete: actions.onDelete,
              onReact: actions.onReact,
            }}
            canReply
          />
        ))
      )}

      {problem ? <Body tone="red">{problem}</Body> : null}

      {starting ? (
        <Composer
          label="Say something"
          busy={busy}
          onSend={(body) => {
            actions.onAdd(null, body);
            settle();
          }}
          onCancel={() => setStarting(false)}
        />
      ) : (
        <Button
          label="Add a comment"
          variant="quiet"
          onPress={() => {
            setOpen({ kind: "none" });
            setStarting(true);
          }}
        />
      )}
    </View>
  );
}
