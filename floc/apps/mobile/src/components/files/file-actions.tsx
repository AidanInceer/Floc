/**
 * What you can do to one file (#325 feedback) — behind the row's dots.
 *
 * OFF THE LINE, BEHIND A PRESS. A re-file dropdown and a Remove button on
 * every row is three controls per file; the pile then reads as a stack of
 * forms rather than a list of files.
 */
import { DOC_CATEGORIES, DOC_CATEGORY_LABELS, type DocCategory } from "@floc/core/documents/documents";
import { View } from "react-native";

import { Sheet } from "../system/sheet";
import { Body, Button, Dropdown } from "../system/ui";
import { space } from "@/lib/theme";

const CATEGORY_OPTIONS = DOC_CATEGORIES.map((value) => ({
  value,
  label: DOC_CATEGORY_LABELS[value],
}));

export function FileActions({
  name,
  category,
  busy,
  onRefile,
  onRemove,
  onClose,
}: {
  /** Null when nothing is open. */
  name: string | null;
  category: DocCategory;
  busy: boolean;
  onRefile: (next: DocCategory) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet open={name !== null} onClose={onClose}>
      <View style={{ paddingHorizontal: space.lg, gap: space.md }}>
        <Body bold>{name}</Body>
        <Dropdown
          label="Filed under"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={onRefile}
        />
        <Button label="Remove" variant="danger" busy={busy} onPress={onRemove} />
      </View>
    </Sheet>
  );
}
