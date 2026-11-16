import { DOC_CATEGORIES, DOC_CATEGORY_LABELS, type DocCategory } from "@floc/core/documents/documents";
import { TEXT_CAPS } from "@floc/core/text/text";
import { View } from "react-native";

import { Sheet } from "../system/sheet";
import { InlineRename } from "../system/inline-rename";
import { Button, Dropdown } from "../system/ui";
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
  onRename,
  onClose,
}: {
  name: string | null;
  category: DocCategory;
  busy: boolean;
  onRefile: (next: DocCategory) => void;
  onRemove: () => void;
  onRename: (next: string) => Promise<unknown>;
  onClose: () => void;
}) {
  return (
    <Sheet open={name !== null} onClose={onClose}>
      <View style={{ paddingHorizontal: space.lg, gap: space.md }}>
        {name !== null ? (
          <InlineRename key={name} value={name} maxLength={TEXT_CAPS.documentName} onSave={onRename} />
        ) : null}
        <Dropdown
          label="Filed under"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={onRefile}
        />
        <Button label="Archive" variant="quiet" busy={busy} onPress={onRemove} />
      </View>
    </Sheet>
  );
}
