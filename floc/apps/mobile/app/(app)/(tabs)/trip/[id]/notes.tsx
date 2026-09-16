/**
 * Notes (#301, #302) — the trip's shared notebook, typed straight onto the
 * page. Every edit goes into the live Yjs doc the web edits too (#394), one
 * block at a time, so two people writing at once both keep their words.
 *
 * Blocks the phone cannot draw (tables, images) render read-only and are
 * never touched. Reordering, nesting and the "/" menu stay on the website.
 */
import {
  insertLiveBlock,
  removeLiveBlock,
  setLiveChecked,
  setLiveText,
  setLiveType,
} from "@floc/core/notes/live/live-blocks";
import { LIVE_STATUS_WORDS } from "@floc/core/notes/live/live-status";
import { isChecked, isDrawn, type DrawnBlock, type NoteBlock } from "@floc/core/notes/note-blocks";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";

import { NoteBlockView } from "@/components/notes/note-block";
import { NoteLine } from "@/components/notes/note-line";
import { useLiveNotes } from "@/components/notes/use-live-notes";
import { useTheme } from "@/components/system/theme";
import { Body, Loading } from "@/components/system/ui";
import { newBlockId } from "@/lib/notes/block-id";
import { radius, space } from "@/lib/theme";

const TYPES: { value: DrawnBlock; label: string }[] = [
  { value: "paragraph", label: "Text" },
  { value: "heading", label: "Heading" },
  { value: "bulletListItem", label: "Bullet" },
  { value: "numberedListItem", label: "Numbered" },
  { value: "checkListItem", label: "To do" },
];

function numberIn(blocks: NoteBlock[], at: number): number {
  let count = 1;
  for (let i = at - 1; i >= 0; i -= 1) {
    if (blocks[i].type !== "numberedListItem") break;
    count += 1;
  }
  return count;
}

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
  const live = useLiveNotes(Number(id));
  const [focused, setFocused] = useState<string | null>(null);
  const inputs = useRef<Record<string, TextInput | null>>({});
  const wanted = useRef<string | null>(null);

  // Focus follows a split or a delete, after the render that made or removed the line.
  useEffect(() => {
    if (wanted.current === null) return;
    inputs.current[wanted.current]?.focus();
    wanted.current = null;
  });

  if (!live || (live.blocks.length === 0 && live.status === "saving")) return <Loading />;
  const { doc, blocks, status } = live;

  function split(at: number) {
    const block = blocks[at];
    const next = newBlockId();
    const kind = (block.type === "heading" ? "paragraph" : block.type) as DrawnBlock;
    insertLiveBlock(doc, block.id!, next, kind);
    wanted.current = next;
  }

  function backspace(at: number) {
    if (removeLiveBlock(doc, blocks[at].id!)) wanted.current = blocks[Math.max(0, at - 1)].id ?? null;
  }

  const current = blocks.find((block) => block.id === focused) ?? null;

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.xs }} keyboardShouldPersistTaps="handled">
      {blocks.map((block, at) => {
        const key = block.id ?? String(at);
        return isDrawn(block) ? (
          <NoteLine
            key={key}
            ref={(input) => {
              inputs.current[key] = input;
            }}
            block={block}
            index={numberIn(blocks, at)}
            onChangeText={(text) => setLiveText(doc, key, text)}
            onSplit={() => split(at)}
            onBackspaceEmpty={() => backspace(at)}
            onToggle={() => setLiveChecked(doc, key, !isChecked(block))}
            onFocus={() => setFocused(key)}
          />
        ) : (
          <NoteBlockView key={key} block={block} index={numberIn(blocks, at)} onPress={() => {}} onToggle={() => {}} />
        );
      })}

      {current && isDrawn(current) ? (
        <View style={{ paddingTop: space.md, gap: space.sm }}>
          <TypeBar current={current} onPick={(type) => setLiveType(doc, current.id!, type)} />
        </View>
      ) : null}

      <View style={{ paddingTop: space.lg, alignItems: "flex-end" }}>
        <Body tone="ink-3">{LIVE_STATUS_WORDS[status]}</Body>
      </View>
    </ScrollView>
  );
}
