/**
 * Talk about one event, on a phone (ticket 325), drawn as the web's (event comments D).
 *
 * ONE LEVEL DEEP, LIKE THE WEB'S. A reply to a reply attaches to the same
 * parent — the server decides that, not this file — so a run is a comment and
 * a flat list under it, folded until asked for. Nothing here recurses.
 *
 * ONE HEART. The table still holds agree and disagree; neither is drawn or
 * counted, the same on both surfaces (`likes` in `@floc/core/notes/notes`).
 *
 * REFUSALS ARE SENTENCES. An empty body and a comment that has gone are
 * ordinary mistakes; they read under the composer rather than crashing it.
 */
import type { Comment } from "@floc/api/port";
import { repliesLabel, threadCount } from "@floc/core/notes/notes";
import type { ReactionKind } from "@floc/core/vocabulary";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { CommentComposer } from "./comment-composer";
import { CommentOne } from "./comment-one";
import { useTheme } from "../system/theme";
import { Body, SectionTitle } from "../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

export type ThreadActions = {
  /** Null `replyTo` starts a run. `landed` runs once the server took it, not on a refusal. */
  onAdd: (replyTo: number | null, body: string, landed: () => void) => void;
  onEdit: (commentId: number, body: string, landed: () => void) => void;
  onDelete: (commentId: number) => void;
  onReact: (commentId: number, kind: ReactionKind) => void;
  /** A refusal belongs to the box that sent it; opening or closing a box drops it. */
  onClearProblem: () => void;
};

/** Nothing open, answering a run, or rewriting your own. One state, so two cannot both be true. */
type Open =
  | { kind: "none" }
  | { kind: "reply"; id: number }
  | { kind: "edit"; id: number };

/** Whether the open box belongs to this run: its own comment or one of its replies. */
function runHolds(run: Comment, id: number): boolean {
  return run.id === id || run.replies.some((reply) => reply.id === id);
}

function Fold({
  count,
  open,
  onPress,
}: {
  count: number;
  open: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: space.sm,
        minHeight: 36,
        paddingRight: space.xs,
        borderRadius: radius.sm,
        backgroundColor: pressed ? c["pen-2"] : "transparent",
      })}
    >
      <View
        style={{ width: 22, borderTopWidth: 1, borderTopColor: c["rule-2"] }}
      />
      <Text
        style={{
          color: c["ink-2"],
          fontFamily: fonts.sansBold,
          fontSize: size.small,
        }}
      >
        {repliesLabel(count, open)}
      </Text>
    </Pressable>
  );
}

function Run({
  comment,
  viewerId,
  busy,
  open,
  setOpen,
  actions,
  problem,
}: {
  comment: Comment;
  viewerId: string;
  busy: boolean;
  open: Open;
  setOpen: (next: Open) => void;
  actions: ThreadActions;
  /** A refusal for the box open in this run, drawn under that box. */
  problem: string | null;
}) {
  const [unfolded, setUnfolded] = useState(false);
  const replying = open.kind === "reply" && open.id === comment.id;
  const count = comment.replies.length;

  const draw = (one: Comment, reply: boolean) =>
    open.kind === "edit" && open.id === one.id ? (
      <View key={one.id} style={{ gap: space.sm }}>
        <CommentComposer
          label="Edit comment"
          sendLabel="Save"
          busy={busy}
          initial={one.body}
          autoFocus
          onSend={(body) => actions.onEdit(one.id, body, () => {})}
          onCancel={() => setOpen({ kind: "none" })}
        />
        {problem ? <Body tone="red">{problem}</Body> : null}
      </View>
    ) : (
      <CommentOne
        key={one.id}
        comment={one}
        mine={one.createdBy === viewerId}
        reply={reply}
        hasReplies={!reply && count > 0}
        onReply={() => {
          setUnfolded(true);
          setOpen({ kind: "reply", id: comment.id });
        }}
        onReact={() => actions.onReact(one.id, "heart")}
        onEdit={() => setOpen({ kind: "edit", id: one.id })}
        onDelete={() => actions.onDelete(one.id)}
      />
    );

  return (
    <View>
      {draw(comment, false)}
      <View style={{ marginLeft: 41, gap: space.sm }}>
        {count > 0 ? (
          <Fold
            count={count}
            open={unfolded}
            onPress={() => setUnfolded(!unfolded)}
          />
        ) : null}
        {unfolded ? comment.replies.map((r) => draw(r, true)) : null}
        {replying ? (
          <CommentComposer
            label={`Reply to ${comment.authorName}`}
            busy={busy}
            autoFocus
            onSend={(body) => actions.onAdd(comment.id, body, () => {})}
            onCancel={() => setOpen({ kind: "none" })}
          />
        ) : null}
        {replying && problem ? <Body tone="red">{problem}</Body> : null}
      </View>
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
  const { c } = useTheme();
  const [open, setOpenBox] = useState<Open>({ kind: "none" });
  const setOpen = (next: Open) => {
    actions.onClearProblem();
    setOpenBox(next);
  };
  // Why: the composer keeps its own words; a new key once they are sent is what empties it.
  const [sent, setSent] = useState(0);
  const count = threadCount(comments);

  // Whatever landed closes every composer: a reply that has landed is not still
  // being written, and a stale box invites it to be sent twice. A refusal keeps the words.
  const settled: ThreadActions = {
    onAdd: (replyTo, body) =>
      actions.onAdd(replyTo, body, () => {
        setOpen({ kind: "none" });
        if (replyTo === null) setSent((n) => n + 1);
      }),
    onEdit: (id, body) =>
      actions.onEdit(id, body, () => setOpen({ kind: "none" })),
    onDelete: actions.onDelete,
    onReact: actions.onReact,
    onClearProblem: actions.onClearProblem,
  };

  return (
    <View style={{ gap: space.md + 2 }}>
      <View
        style={{ flexDirection: "row", alignItems: "baseline", gap: space.sm }}
      >
        <SectionTitle>Comments</SectionTitle>
        {count ? (
          <Text
            style={{
              color: c["ink-3"],
              fontFamily: fonts.type,
              fontSize: size.small,
            }}
          >
            {count}
          </Text>
        ) : null}
      </View>

      {comments.map((comment) => (
        <Run
          key={comment.id}
          comment={comment}
          viewerId={viewerId}
          busy={busy}
          open={open}
          setOpen={setOpen}
          actions={settled}
          problem={
            open.kind !== "none" && runHolds(comment, open.id) ? problem : null
          }
        />
      ))}

      {problem && open.kind === "none" ? (
        <Body tone="red">{problem}</Body>
      ) : null}

      <CommentComposer
        key={sent}
        label="Comment"
        busy={busy}
        onSend={(body) => settled.onAdd(null, body, () => {})}
      />
    </View>
  );
}
