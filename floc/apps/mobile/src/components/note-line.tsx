/**
 * One editable line of the trip's notes (#302, replacing #301's editor).
 *
 * WHAT THIS REPLACES AND WHY. #301 made a line a button: tap it, a card opened
 * underneath with a labelled field and Done / Cancel / Delete, and a Save
 * button at the foot of the page sent the lot. That is a form for editing a
 * document, and it made writing three sentences into nine taps. A notebook
 * should be typed into.
 *
 * SO THE LINE *IS* THE INPUT. Every drawn block renders as a `TextInput` that
 * is always live. Enter splits into a new block below, Backspace at the start
 * of an empty one removes it, and the marker down the left stays a marker.
 * Nothing opens, nothing closes, and there is no Save — see `notes.tsx`.
 *
 * ENTER MEANS A NEW BLOCK, NOT A NEWLINE. `submitBehavior="submit"` on a
 * multiline input is what lets a line wrap for a long sentence while Enter
 * still ends the block. Without it the two are the same key and a document is
 * one paragraph.
 *
 * A BLOCK THE PHONE CANNOT DRAW IS NOT EDITED HERE. Tables, images and the
 * rest come back through `NoteBlockView` read-only, so `setBlockText` never
 * touches a block whose shape this file does not understand (rule: splits and
 * documents are carried through, not rebuilt).
 */
import {
  blockText,
  headingLevel,
  isChecked,
  type NoteBlock,
} from "@floc/core/note-blocks";
import { forwardRef } from "react";
import { Pressable, Text, TextInput, View, type NativeSyntheticEvent, type TextInputKeyPressEventData } from "react-native";

import { useTheme } from "./theme";
import { fonts, size, space } from "@/lib/theme";

const HEADING_SIZE = { 1: size.display, 2: size.heading, 3: 17 } as const;

/** Wide enough for "to do", which is the longest marker. */
const GUTTER = 38;

/** The marker down the left. A word for a checkbox, a mark for a bullet — never colour alone (#204). */
function Marker({
  block,
  index,
  onToggle,
}: {
  block: NoteBlock;
  index: number;
  onToggle: () => void;
}) {
  const { c } = useTheme();
  const mark = (text: string) => (
    <Text
      style={{
        color: c["ink-3"],
        fontFamily: fonts.type,
        fontSize: size.body,
        lineHeight: 24,
        textAlign: "right",
      }}
    >
      {text}
    </Text>
  );

  if (block.type === "checkListItem") {
    const done = isChecked(block);
    return (
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: done }} onPress={onToggle}>
        {/* "done" / "to do" carries it; there is no tick only some people can see (#204). */}
        <Text
          style={{
            color: done ? c["mint-ink"] : c["ink-3"],
            fontFamily: fonts.type,
            fontSize: size.label,
            lineHeight: 24,
            textAlign: "right",
          }}
        >
          {done ? "done" : "to do"}
        </Text>
      </Pressable>
    );
  }
  if (block.type === "bulletListItem") return mark("•");
  if (block.type === "numberedListItem") return mark(`${index}.`);
  return null;
}

export const NoteLine = forwardRef<
  TextInput,
  {
    block: NoteBlock;
    /** Its place among the numbered items before it, for a numbered list's figure. */
    index: number;
    onChangeText: (text: string) => void;
    /** Enter: everything after the caret becomes a new block below. */
    onSplit: () => void;
    /** Backspace in an empty block: it goes, and the one above takes the caret. */
    onBackspaceEmpty: () => void;
    onToggle: () => void;
    onFocus: () => void;
  }
>(function NoteLine({ block, index, onChangeText, onSplit, onBackspaceEmpty, onToggle, onFocus }, ref) {
  const { c } = useTheme();
  const heading = block.type === "heading";
  const struck = block.type === "checkListItem" && isChecked(block);
  const text = blockText(block);

  function key(event: NativeSyntheticEvent<TextInputKeyPressEventData>) {
    if (event.nativeEvent.key === "Backspace" && text === "") onBackspaceEmpty();
  }

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space.sm }}>
      {/* The gutter is always there, empty or not. Without a fixed width a
          paragraph starts in a different column from the bullet under it, and
          the document reads as two documents. */}
      <View style={{ width: GUTTER, paddingTop: space.xs }}>
        <Marker block={block} index={index} onToggle={onToggle} />
      </View>
      <TextInput
        ref={ref}
        accessibilityLabel={heading ? "Heading" : "Line"}
        value={text}
        onChangeText={onChangeText}
        onKeyPress={key}
        onSubmitEditing={onSplit}
        onFocus={onFocus}
        multiline
        submitBehavior="submit"
        placeholder={index === 1 && text === "" ? "Write something" : ""}
        placeholderTextColor={c["ink-3"]}
        style={{
          flex: 1,
          paddingVertical: space.xs,
          color: struck ? c["ink-3"] : c.ink,
          fontFamily: heading ? fonts.display : fonts.sans,
          fontSize: heading ? HEADING_SIZE[headingLevel(block)] : size.body,
          fontWeight: heading ? "600" : "400",
          lineHeight: heading ? 32 : 24,
        }}
      />
    </View>
  );
});
