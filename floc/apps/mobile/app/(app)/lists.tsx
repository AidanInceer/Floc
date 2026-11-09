/**
 * Lists (#467): what you keep, one level under You. Saved holds your Explore trips and want-to-go
 * countries; Packing holds your saved packing lists (#230). The same two pages as the web's Lists tab.
 */
import { useState } from "react";
import { View } from "react-native";

import { PackingPane } from "@/components/lists/packing-pane";
import { SavedPane } from "@/components/lists/saved-pane";
import { ReactionGlyph } from "@/components/system/glyphs";
import { Segmented } from "@/components/system/ui";
import { SectionGlyph } from "@/components/trip/section-glyph";
import { space } from "@/lib/theme";

type Page = "saved" | "packing";

const PAGES = [
  { value: "saved" as const, label: "Saved", icon: (color: string) => <ReactionGlyph kind="heart" mine={false} color={color} /> },
  { value: "packing" as const, label: "Packing", icon: (color: string) => <SectionGlyph route="packing" color={color} /> },
];

export default function Lists() {
  const [page, setPage] = useState<Page>("saved");
  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <Segmented options={PAGES} value={page} onChange={setPage} />
      </View>
      {page === "saved" ? <SavedPane /> : <PackingPane />}
    </View>
  );
}
