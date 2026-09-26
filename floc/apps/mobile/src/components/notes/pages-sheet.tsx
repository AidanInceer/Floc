/**
 * The page list on the phone (#408), as a sheet from the Pages button: the
 * same pages and sub-pages as the website's list, with who is on each. Press a
 * page to open it; its ⋯ opens what the web's menu holds — add a sub-page,
 * rename, icon, archive. Archived pages wait at the foot with Restore.
 */
import type { PresentPerson } from "@floc/core/notes/live/live-presence";
import { PAGE_ICON_ART, PAGE_ICONS, PAGE_ICON_LABELS, type PageIcon } from "@floc/core/notes/pages/page-icons";
import { PAGE_LIMITS, archiveDaysLeft, pagesRefusal } from "@floc/core/notes/pages/page-rules";
import type { ArchivedNotesPage, NotesPage } from "@floc/api/port-pages";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { PresenceRow } from "@/components/notes/live-presence";
import { IconArtMark } from "@/components/system/icon-art";
import { InlineRename } from "@/components/system/inline-rename";
import { MoreGlyph, PlusGlyph } from "@/components/system/glyphs";
import { Sheet } from "@/components/system/sheet";
import { useTheme } from "@/components/system/theme";
import { Body, Button, IconButton, Label } from "@/components/system/ui";
import { radius, space } from "@/lib/theme";

export type SheetActions = {
  open: (id: number) => void;
  add: (parentId: number | null) => void;
  rename: (id: number, title: string) => Promise<unknown>;
  icon: (id: number, icon: PageIcon | null) => void;
  /** Before a sibling, or to the end of its list with null. */
  move: (id: number, beforeId: number | null) => void;
  archive: (id: number) => void;
  restore: (id: number) => void;
};

const nameOf = (page: { title: string }) => page.title || "Untitled";

function IconGrid({ current, onPick }: { current: PageIcon | null; onPick: (icon: PageIcon | null) => void }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs }}>
      {PAGE_ICONS.map((icon) => (
        <IconButton key={icon} label={PAGE_ICON_LABELS[icon]} on={current === icon} onColor="pastel-blue" onPress={() => onPick(icon)}>
          {(ink) => <IconArtMark art={PAGE_ICON_ART[icon]} color={ink} size={18} />}
        </IconButton>
      ))}
      {current ? <Button label="Remove icon" variant="quiet" fit="small" onPress={() => onPick(null)} /> : null}
    </View>
  );
}

/** Where Move up and Move down send a page among its siblings; undefined when it cannot go that way. */
function places(pages: NotesPage[], page: NotesPage): { up: number | null | undefined; down: number | null | undefined } {
  const siblings = pages.filter((p) => p.parentId === page.parentId);
  const at = siblings.findIndex((p) => p.id === page.id);
  const up = at > 0 ? siblings[at - 1].id : undefined;
  const down = at < siblings.length - 1 ? (siblings[at + 2]?.id ?? null) : undefined;
  return { up, down };
}

function PageActions({ page, kids, onlyPage, place, actions }: { page: NotesPage; kids: number; onlyPage: boolean; place: ReturnType<typeof places>; actions: SheetActions }) {
  const { c } = useTheme();
  const [icons, setIcons] = useState(false);
  return (
    <View style={{ gap: space.sm, padding: space.md, marginBottom: space.sm, borderRadius: radius.md, backgroundColor: c["sheet-2"] }}>
      <InlineRename value={nameOf(page)} maxLength={PAGE_LIMITS.titleChars} onSave={(title) => actions.rename(page.id, title)} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
        {page.depth === 0 ? <Button label="Add a sub-page" variant="quiet" fit="small" onPress={() => actions.add(page.id)} /> : null}
        <Button label={page.icon ? "Change icon" : "Add icon"} variant="quiet" fit="small" onPress={() => setIcons(!icons)} />
        <Button label="Move up" variant="quiet" fit="small" disabled={place.up === undefined} onPress={() => { if (place.up !== undefined) actions.move(page.id, place.up); }} />
        <Button label="Move down" variant="quiet" fit="small" disabled={place.down === undefined} onPress={() => { if (place.down !== undefined) actions.move(page.id, place.down); }} />
        <Button
          label={kids ? `Archive with ${kids} sub-page${kids > 1 ? "s" : ""}` : "Archive"}
          variant="danger"
          fit="small"
          disabled={onlyPage}
          onPress={() => actions.archive(page.id)}
        />
      </View>
      {onlyPage ? <Body tone="ink-3">The last page stays.</Body> : null}
      {icons ? <IconGrid current={page.icon} onPick={(icon) => { actions.icon(page.id, icon); setIcons(false); }} /> : null}
    </View>
  );
}

function PageItem({ page, open, here, acting, onMore, onOpen }: {
  page: NotesPage; open: boolean; here: PresentPerson[]; acting: boolean; onMore: () => void; onOpen: () => void;
}) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, paddingLeft: page.depth ? space.xl : 0 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: open }}
        accessibilityLabel={nameOf(page)}
        onPress={onOpen}
        style={({ pressed }) => ({
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: space.sm,
          paddingVertical: space.sm,
          paddingHorizontal: space.sm,
          borderRadius: radius.sm,
          backgroundColor: open ? c["sheet-3"] : "transparent",
          opacity: pressed ? 0.7 : 1,
        })}
      >
        {page.icon ? <IconArtMark art={PAGE_ICON_ART[page.icon]} color={c["ink-2"]} size={15} /> : null}
        <Body tone={open || page.depth === 0 ? "ink" : "ink-2"}>{nameOf(page)}</Body>
      </Pressable>
      {here.length ? <PresenceRow people={here} /> : null}
      <IconButton label={`${nameOf(page)} options`} on={acting} onColor="pastel-blue" onPress={onMore}>
        {(ink) => <MoreGlyph color={ink} />}
      </IconButton>
    </View>
  );
}

function Archived({ pages, onRestore }: { pages: ArchivedNotesPage[]; onRestore: (id: number) => void }) {
  if (!pages.length) return null;
  const now = new Date();
  return (
    <View style={{ gap: space.sm, paddingTop: space.md }}>
      <Label>Archived</Label>
      {pages.map((page) => {
        const left = archiveDaysLeft(new Date(page.archivedAt), now);
        return (
          <View key={page.id} style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <View style={{ flex: 1 }}>
              <Body tone="ink-2">{nameOf(page)}</Body>
              <Body tone="ink-3">{`${left} day${left === 1 ? "" : "s"} left`}</Body>
            </View>
            <Button label="Restore" variant="quiet" fit="small" onPress={() => onRestore(page.id)} />
          </View>
        );
      })}
    </View>
  );
}

export function PagesSheet({ open, onClose, pages, archived, openId, byPage, error, actions }: {
  open: boolean;
  onClose: () => void;
  pages: NotesPage[];
  archived: ArchivedNotesPage[];
  openId: number | null;
  byPage: Map<number, PresentPerson[]>;
  error: string | null;
  actions: SheetActions;
}) {
  const [acting, setActing] = useState<number | null>(null);
  const full = pagesRefusal(pages.length);
  return (
    <Sheet open={open} onClose={onClose}>
      <View style={{ paddingHorizontal: space.lg, gap: space.xs }}>
        <Label>Pages</Label>
        {pages.map((page) => {
          const kids = pages.filter((p) => p.parentId === page.id).length;
          return (
            <View key={page.id}>
              <PageItem page={page} open={page.id === openId} here={byPage.get(page.id) ?? []} acting={acting === page.id}
                onMore={() => setActing(acting === page.id ? null : page.id)} onOpen={() => { actions.open(page.id); onClose(); }} />
              {acting === page.id ? <PageActions page={page} kids={kids} onlyPage={pages.length <= 1 + kids} place={places(pages, page)} actions={actions} /> : null}
            </View>
          );
        })}
        {error ? <Body tone="red">{error}</Body> : null}
        <View style={{ paddingTop: space.sm }}>
          <Button label="New page" variant="quiet" disabled={!!full} icon={(ink) => <PlusGlyph color={ink} />} onPress={() => actions.add(null)} />
          {full ? <Body tone="ink-3">{full}</Body> : null}
        </View>
        <Archived pages={archived} onRestore={actions.restore} />
      </View>
    </Sheet>
  );
}
