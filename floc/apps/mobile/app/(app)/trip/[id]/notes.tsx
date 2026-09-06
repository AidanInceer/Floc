/**
 * Notes (ticket 301) — the trip's shared notebook.
 *
 * NATIVE, NOT A WEBVIEW. Decision: `301-notes-on-a-phone`. BlockNote's
 * document is JSON and nothing about reading it needs a browser; a browser
 * embedded for one screen would bring its own type and fight the tokens.
 *
 * NOTHING IS LOST IN A ROUND TRIP. The screen never rebuilds the document. It
 * edits one block at a time through `setBlockText`, which carries that block's
 * `id`, `type`, `props` and `children` through untouched — so a table, an
 * image or a nested list written on the web comes back out exactly as it went
 * in, even though the phone cannot draw it.
 *
 * WHAT THIS DOES NOT DO, said rather than hidden: reordering, nesting, tables,
 * images and the "/" menu stay on the web. A block the phone cannot draw says
 * so on its own line.
 *
 * LAST WRITE WINS (rule 7). No version check and no merge screen, the same as
 * the web page. Two people writing at once means the later save is the note.
 *
 * NO DATES NEEDED (rule 9). Notes works identically on an undated trip.
 */
import {
  blockText,
  newBlock,
  parseNoteDoc,
  serialiseNoteDoc,
  setBlockText,
  setChecked,
  isChecked,
  type DrawnBlock,
  type NoteBlock,
} from "@floc/core/note-blocks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";

import { NoteBlockView } from "@/components/note-block";
import { Body, Button, Card, Failed, Field, Label, Loading, Segmented } from "@/components/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

const NEW_TYPES = [
  { value: "paragraph" as const, label: "Text" },
  { value: "heading" as const, label: "Heading" },
  { value: "bulletListItem" as const, label: "Bullet" },
  { value: "checkListItem" as const, label: "To do" },
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

export default function Notes() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  const queryClient = useQueryClient();

  const doc = useQuery(trpc.notes.get.queryOptions({ tripId }));

  /** The working copy. Null until the server's document has been read in. */
  const [blocks, setBlocks] = useState<NoteBlock[] | null>(null);
  const [editingAt, setEditingAt] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState<DrawnBlock | null>(null);
  const [dirty, setDirty] = useState(false);

  // Loads the server's document once. It deliberately does not overwrite a
  // document being edited — that would take a person's typing away from them
  // mid-sentence, which is worse than the stale read rule 7 already allows.
  useEffect(() => {
    if (doc.data !== undefined && blocks === null) setBlocks(parseNoteDoc(doc.data));
  }, [doc.data, blocks]);

  const save = useMutation({
    ...trpc.notes.write.mutationOptions(),
    onSuccess: () => {
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: trpc.notes.get.queryKey({ tripId }) });
    },
  });

  if (doc.isPending || blocks === null) return <Loading />;
  if (doc.isError) return <Failed onRetry={() => doc.refetch()} />;

  const change = (next: NoteBlock[]) => {
    setBlocks(next);
    setDirty(true);
  };

  const openEdit = (at: number) => {
    setEditingAt(at);
    setDraft(blockText(blocks[at]));
    setAdding(null);
  };

  const commitEdit = () => {
    if (editingAt === null) return;
    change(blocks.map((block, i) => (i === editingAt ? setBlockText(block, draft) : block)));
    setEditingAt(null);
  };

  const removeAt = (at: number) => {
    change(blocks.filter((_, i) => i !== at));
    setEditingAt(null);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
      {blocks.length === 0 ? (
        <Body tone="ink-2">Nothing written yet. Everyone on the trip can write here.</Body>
      ) : null}

      {blocks.map((block, at) =>
        editingAt === at ? (
          <Card key={at}>
            <View style={{ gap: space.md }}>
              <Field label="This line" value={draft} onChangeText={setDraft} multiline autoFocus />
              <Button label="Done" onPress={commitEdit} />
              <Button label="Cancel" variant="quiet" onPress={() => setEditingAt(null)} />
              <Button label="Delete this line" variant="danger" onPress={() => removeAt(at)} />
            </View>
          </Card>
        ) : (
          <NoteBlockView
            key={at}
            block={block}
            index={numberIn(blocks, at)}
            onPress={() => openEdit(at)}
            onToggle={() =>
              change(
                blocks.map((row, i) =>
                  i === at ? setChecked(row, !isChecked(row)) : row,
                ),
              )
            }
          />
        ),
      )}

      <View style={{ gap: space.sm, paddingTop: space.md }}>
        <Label>Add a line</Label>
        <Segmented
          options={NEW_TYPES}
          value={adding ?? "paragraph"}
          onChange={(type) => setAdding(type)}
        />
        <Button
          label="Add it"
          onPress={() => {
            change([...blocks, newBlock(adding ?? "paragraph", "")]);
            openEdit(blocks.length);
          }}
        />
      </View>

      <Button
        label={dirty ? "Save the note" : "Nothing to save"}
        disabled={!dirty}
        busy={save.isPending}
        onPress={() => save.mutate({ tripId, body: serialiseNoteDoc(blocks) })}
      />
      {save.isError ? <Body tone="red">{save.error.message}</Body> : null}

      <Body tone="ink-3">
        Reordering, tables and images are on the website.
      </Body>
    </ScrollView>
  );
}
