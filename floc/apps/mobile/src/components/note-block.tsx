/**
 * One block of the trip's Notes, drawn natively (ticket 301).
 *
 * NOT A WEBVIEW, on purpose. Decision: `301-notes-on-a-phone`. BlockNote's
 * document is JSON, and a browser embedded for one screen would bring its own
 * fonts, scrolling and stylesheet and fight the tokens the whole way.
 *
 * A BLOCK THIS DOES NOT DRAW IS STILL SHOWN, as its text, and is never
 * rewritten — `setBlockText` carries a block's `id`, `type` and `props`
 * through untouched, so a table written on the web survives a phone edit.
 *
 * Highlights and links are drawn from the same `styles` BlockNote wrote, and a
 * link says so with an underline AND its own colour, never colour alone (#204).
 */
import {
  headingLevel,
  inlineRuns,
  isChecked,
  isDrawn,
  type NoteBlock,
} from "@floc/core/note-blocks";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "./theme";
import { fonts, size, space } from "@/lib/theme";

const HEADING_SIZE = { 1: size.heading, 2: 17, 3: size.body } as const;

/** The marker down the left of a list item. A word for a checkbox, a mark for a bullet. */
function Marker({ block, index, onToggle }: { block: NoteBlock; index: number; onToggle?: () => void }) {
  const { c } = useTheme();
  const mark = (text: string) => (
    <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.body, width: 22 }}>
      {text}
    </Text>
  );

  if (block.type === "checkListItem") {
    const done = isChecked(block);
    return (
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        onPress={onToggle}
      >
        {/* "done" / "to do" carries it; there is no tick that only some people can see (#204). */}
        <Text
          style={{
            color: done ? c["mint-ink"] : c["ink-3"],
            fontFamily: fonts.type,
            fontSize: size.label,
            width: 34,
          }}
        >
          {done ? "done" : "to do"}
        </Text>
      </Pressable>
    );
  }
  if (block.type === "bulletListItem") return mark("·");
  if (block.type === "numberedListItem") return mark(`${index}.`);
  return null;
}

export function NoteBlockView({
  block,
  /** Its place among its siblings of the same kind, for a numbered list's figure. */
  index,
  onPress,
  onToggle,
}: {
  block: NoteBlock;
  index: number;
  onPress: () => void;
  onToggle: () => void;
}) {
  const { c } = useTheme();
  const runs = inlineRuns(block);
  const heading = block.type === "heading";
  const struck = block.type === "checkListItem" && isChecked(block);

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space.sm, paddingVertical: space.xs }}>
      <Marker block={block} index={index} onToggle={onToggle} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit this line"
        onPress={onPress}
        style={{ flex: 1 }}
      >
        <Text
          style={{
            color: struck ? c["ink-3"] : c.ink,
            fontFamily: heading ? fonts.display : fonts.sans,
            fontSize: heading ? HEADING_SIZE[headingLevel(block)] : size.body,
            lineHeight: heading ? 26 : 22,
          }}
        >
          {runs.length === 0 ? (
            <Text style={{ color: c["ink-3"] }}>Empty line</Text>
          ) : (
            runs.map((run, i) => (
              <Text
                key={i}
                style={{
                  fontFamily: run.styles.bold ? fonts.sansBold : undefined,
                  fontStyle: run.styles.italic ? "italic" : undefined,
                  backgroundColor: run.styles.backgroundColor ? c.butter : undefined,
                  color: run.href ? c.pen : undefined,
                  textDecorationLine: run.href ? "underline" : undefined,
                }}
              >
                {run.text}
              </Text>
            ))
          )}
        </Text>
        {/* What is missing is worth saying; what is drawn is not (#126). */}
        {!isDrawn(block) ? (
          <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.label }}>
            {block.type} — edit this one on the website
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}
