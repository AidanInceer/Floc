/**
 * Lists (#467): what you keep, one level under You. Saved holds your Explore trips and want-to-go
 * countries; Wish lists are kept with other people (#623); Packing holds your saved packing lists (#230). The web's Lists pages.
 */
import { useState } from "react";
import { View } from "react-native";

import { PackingPane } from "@/components/lists/packing-pane";
import { SavedPane } from "@/components/lists/saved-pane";
import { WishListsPane } from "@/components/lists/wish-lists-pane";
import { ReactionGlyph, WishListGlyph } from "@/components/system/glyphs";
import { Segmented } from "@/components/system/ui";
import { SectionGlyph } from "@/components/trip/section-glyph";
import { space } from "@/lib/theme";

type Page = "saved" | "wish" | "packing";

const PAGES = [
  { value: "saved" as const, label: "Saved", icon: (color: string) => <ReactionGlyph kind="heart" mine={false} color={color} /> },
  { value: "wish" as const, label: "Wish lists", icon: (color: string) => <WishListGlyph color={color} /> },
  { value: "packing" as const, label: "Packing", icon: (color: string) => <SectionGlyph route="packing" color={color} /> },
];

export default function Lists() {
  const [page, setPage] = useState<Page>("saved");
  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <Segmented options={PAGES} value={page} onChange={setPage} />
      </View>
      {page === "saved" ? <SavedPane /> : page === "wish" ? <WishListsPane /> : <PackingPane />}
    </View>
  );
}
