/**
 * Putting a new file up, from wherever it is being added (ticket 325).
 *
 * SPLIT OUT BECAUSE THE PICKER IS ITS OWN JOB. The section around it lists and
 * unlists; this asks two questions, reads a file off the disk and hands back
 * the answer. Keeping them apart is also what keeps either readable.
 *
 * SHARED OR PRIVATE RIDES THE LINE THE FILE GOES UP WITH, the same question
 * the Files screen asks in the same place — a question with a right default
 * does not deserve a labelled row of its own.
 *
 * CANCELLING IS NOT AN ERROR. Backing out of the picker answers null and this
 * says nothing.
 */
import { DOC_CATEGORIES, DOC_CATEGORY_LABELS, type DocCategory } from "@floc/core/documents/documents";
import { useState } from "react";
import { View } from "react-native";

import { pickFile, type PickedFile } from "./file-picker";
import { Body, Button, Dropdown, Toggle } from "../system/ui";
import { space } from "@/lib/theme";

const CATEGORY_OPTIONS = DOC_CATEGORIES.map((value) => ({
  value,
  label: DOC_CATEGORY_LABELS[value],
}));

export function AddFile({
  filedUnder,
  busy,
  onPicked,
  onUnreadable,
  onCancel,
}: {
  /** What a file added here is usually for — tickets, on an event. */
  filedUnder: DocCategory;
  busy: boolean;
  onPicked: (file: PickedFile & { category: DocCategory; shared: boolean }) => void;
  onUnreadable: () => void;
  onCancel: () => void;
}) {
  const [category, setCategory] = useState<DocCategory>(filedUnder);
  const [shared, setShared] = useState(true);
  const [picking, setPicking] = useState(false);

  const choose = async () => {
    setPicking(true);
    try {
      const picked = await pickFile();
      if (picked) onPicked({ ...picked, category, shared });
    } catch {
      onUnreadable();
    } finally {
      setPicking(false);
    }
  };

  return (
    <View style={{ gap: space.sm }}>
      <Dropdown
        label="Filed under"
        options={CATEGORY_OPTIONS}
        value={category}
        onChange={setCategory}
      />
      {/* Asked as "make private", not "everyone on the trip": the default is
          shared, so the switch names the thing you would turn on (#325
          feedback). */}
      <Toggle label="Make private" value={!shared} onChange={(on) => setShared(!on)} />
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <Button label="Cancel" variant="quiet" onPress={onCancel} />
        </View>
        <View style={{ flex: 2 }}>
          <Button
            label="Choose a file"
            busy={picking || busy}
            onPress={() => {
              void choose();
            }}
          />
        </View>
      </View>
      <Body tone="ink-3">PDFs and pictures, up to 8 MB.</Body>
    </View>
  );
}
