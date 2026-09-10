/**
 * Notes (ticket 301, rewritten #302) — the trip's shared notebook.
 *
 * IT IS A PAGE YOU TYPE ON. The first cut was a form: tap a line, a card
 * opened with a labelled field and Done / Cancel / Delete, then a Save button
 * at the foot sent the document. Writing three sentences took nine taps and
 * the thing never felt like a notebook. Now every line is live — you type into
 * it, Enter starts the next one, Backspace on an empty one removes it, and
 * nothing is saved by hand.
 *
 * AUTOSAVE, NOT A BUTTON. A pause of `SAVE_AFTER_MS` sends the document. That
 * is the whole point of the rewrite: a shared notebook whose contents depend
 * on somebody remembering to press Save is a notebook that loses things. It
 * still says whether the last save landed — that is *status*, which text
 * carries even when the drawing is clear.
 *
 * LAST WRITE WINS (rule 7). No version check and no merge screen, the same as
 * the web page. Two people writing at once means the later save is the note,
 * and autosave does not change that — it only makes "later" arrive sooner.
 *
 * NOTHING IS LOST IN A ROUND TRIP. The document is never rebuilt. Edits go
 * through `setBlockText`, which carries a block's `id`, `type`, `props` and
 * `children` through untouched — so a table, an image or a nested list written
 * on the web comes back out exactly as it went in, even though the phone
 * cannot draw it. Those blocks render read-only and say so.
 *
 * WHAT IS STILL ON THE WEB, said rather than hidden: reordering, nesting,
 * tables, images and the "/" menu.
 *
 * NO DATES NEEDED (rule 9). Notes works identically on an undated trip.
 */
import {
  blockText,
  isDrawn,
  newBlock,
  parseNoteDoc,
  serialiseNoteDoc,
  setBlockText,
  setChecked,
  isChecked,
  type DrawnBlock,
  type NoteBlock,
} from "@floc/core/notes/note-blocks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";

import { NoteBlockView } from "@/components/notes/note-block";
import { NoteLine } from "@/components/notes/note-line";
import { useTheme } from "@/components/system/theme";
import { Body, Failed, Loading } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { radius, space } from "@/lib/theme";

/** How long a pause counts as "stopped typing". Long enough not to send a word at a time. */
const SAVE_AFTER_MS = 1200;

const TYPES: { value: DrawnBlock; label: string }[] = [
  { value: "paragraph", label: "Text" },
  { value: "heading", label: "Heading" },
  { value: "bulletListItem", label: "Bullet" },
  { value: "numberedListItem", label: "Numbered" },
  { value: "checkListItem", label: "To do" },
];

/** Its position among the numbered items directly before it, so a numbered list counts right. */
function numberIn(blocks: NoteBlock[], at: number): number {
  let count = 1;
  for (let i = at - 1; i >= 0; i -= 1) {
    if (blocks[i].type !== "numberedListItem") break;
    count += 1;
  }
  return count;
}

/**
 * The type bar for the line you are on.
 *
 * It only appears while a line has focus, because a permanent row of five
 * words at the foot of a document is five words of furniture. Changing a type
 * keeps the text — `newBlock` is given what `blockText` read.
 */
function TypeBar({ current, onPick }: { current: NoteBlock; onPick: (type: DrawnBlock) => void }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
      {TYPES.map((type) => {
        const on = current.type === type.value;
        return (
          <Pressable
            key={type.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={type.label}
            onPress={() => onPick(type.value)}
            style={{
              paddingVertical: space.xs,
              paddingHorizontal: space.md,
              borderRadius: radius.pill,
              backgroundColor: on ? c.mint : c["sheet-2"],
              borderWidth: 1,
              borderColor: on ? c["mint-edge"] : c.rule,
            }}
          >
            <Body tone={on ? "ink" : "ink-3"}>{type.label}</Body>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function Notes() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  // A screen keeps rendering for a frame while it leaves, and `id` is gone by
  // then: NaN goes down the wire as null and the server rightly refuses it.
  const ready = Number.isFinite(tripId);
  const queryClient = useQueryClient();

  const doc = useQuery(trpc.notes.get.queryOptions({ tripId }, { enabled: ready }));

  /** The working copy. Null until the server's document has been read in. */
  const [blocks, setBlocks] = useState<NoteBlock[] | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const inputs = useRef<Record<number, TextInput | null>>({});
  /** Which line to put the caret in after the next render, when a keystroke moved it. */
  const wanted = useRef<number | null>(null);

  // Loads the server's document once. It deliberately does not overwrite a
  // document being edited — that would take a person's typing away from them
  // mid-sentence, which is worse than the stale read rule 7 already allows.
  useEffect(() => {
    if (doc.data === undefined || blocks !== null) return;
    const read = parseNoteDoc(doc.data);
    // An empty document still needs somewhere to type. The blank line is local
    // only — nothing is sent until a key is pressed, so an untouched note stays
    // untouched on the server.
    setBlocks(read.length > 0 ? read : [newBlock("paragraph", "")]);
  }, [doc.data, blocks]);

  const save = useMutation({
    ...trpc.notes.write.mutationOptions(),
    onSuccess: () => {
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: trpc.notes.get.queryKey({ tripId }) });
    },
  });

  // The autosave. One timer, restarted on every keystroke, so a pause is what
  // sends and a fast typist sends once rather than once a letter.
  const send = save.mutate;
  useEffect(() => {
    if (!dirty || blocks === null) return;
    const timer = setTimeout(
      () => send({ tripId, body: serialiseNoteDoc(blocks) }),
      SAVE_AFTER_MS,
    );
    return () => clearTimeout(timer);
  }, [dirty, blocks, tripId, send]);

  // Focus follows a split or a delete. It has to happen after the render that
  // created or removed the line, or there is no input yet to focus.
  useEffect(() => {
    if (wanted.current === null) return;
    inputs.current[wanted.current]?.focus();
    wanted.current = null;
  });

  if (doc.isPending || blocks === null) return <Loading />;
  if (doc.isError) return <Failed onRetry={() => doc.refetch()} />;

  // Bound once past the guards: a hoisted function below cannot see the narrowing.
  const doc_ = blocks;

  const change = (next: NoteBlock[]) => {
    setBlocks(next);
    setDirty(true);
  };

  const replace = (at: number, block: NoteBlock) =>
    change(doc_.map((row, i) => (i === at ? block : row)));

  /** Enter. A new line below, of the same kind — a list carries on being a list. */
  function split(at: number) {
    const kind = doc_[at].type;
    const next: DrawnBlock = (
      kind === "heading" ? "paragraph" : kind
    ) as DrawnBlock;
    change([...doc_.slice(0, at + 1), newBlock(next, ""), ...doc_.slice(at + 1)]);
    wanted.current = at + 1;
  }

  /** Backspace on an empty line. It goes, and the caret lands on the one above. */
  function backspace(at: number) {
    if (doc_.length === 1) return;
    change(doc_.filter((_, i) => i !== at));
    wanted.current = Math.max(0, at - 1);
  }

  const current = focused === null ? null : (doc_[focused] ?? null);

  return (
    <ScrollView
      contentContainerStyle={{ padding: space.lg, gap: space.xs }}
      keyboardShouldPersistTaps="handled"
    >
      {doc_.map((block, at) =>
        isDrawn(block) ? (
          <NoteLine
            key={at}
            ref={(input) => {
              inputs.current[at] = input;
            }}
            block={block}
            index={numberIn(doc_, at)}
            onChangeText={(text) => replace(at, setBlockText(block, text))}
            onSplit={() => split(at)}
            onBackspaceEmpty={() => backspace(at)}
            onToggle={() => replace(at, setChecked(block, !isChecked(block)))}
            onFocus={() => setFocused(at)}
          />
        ) : (
          // Read-only on purpose: the phone cannot draw this shape and must not
          // rewrite what it cannot read.
          <NoteBlockView
            key={at}
            block={block}
            index={numberIn(doc_, at)}
            onPress={() => {}}
            onToggle={() => {}}
          />
        ),
      )}

      {current && isDrawn(current) ? (
        <View style={{ paddingTop: space.md, gap: space.sm }}>
          <TypeBar
            current={current}
            onPick={(type) => {
              if (focused === null) return;
              replace(focused, newBlock(type, blockText(current)));
            }}
          />
        </View>
      ) : null}

      {/* The web editor's own words, exactly — a document that says "Saved" in
          one place and "SAVED · reordering is on the website" in the other is
          two products. Blank while idle, because a document nobody has touched
          has no news (#126). */}
      <View style={{ paddingTop: space.lg, alignItems: "flex-end" }}>
        <Body tone="ink-3">
          {save.isPending
            ? "Saving"
            : save.isError
              ? "Not saved — still trying"
              : dirty || !save.isSuccess
                ? ""
                : "Saved"}
        </Body>
      </View>
    </ScrollView>
  );
}
