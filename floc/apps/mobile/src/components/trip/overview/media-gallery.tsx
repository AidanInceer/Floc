import { fillRows, mediaRatio, videoClock, type MediaGroup } from "@floc/core/media/media";
import type { TripMediaItem } from "@floc/api/port/media";
import { useMemo, useRef, useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { openFileNatively } from "../../files/open-file";
import { Face } from "../../system/face";
import { useTheme } from "../../system/theme";
import { Button, IconButton } from "../../system/ui";
import { BinGlyph, ChevronGlyph, CrossGlyph, PlayGlyph, UploadGlyph } from "@/components/system/glyphs";
import { API_BASE_URL } from "@/lib/config";
import { fonts, radius, size, space } from "@/lib/theme";

export const fullUrl = (path: string) => `${API_BASE_URL}${path}`;

export function MediaThumb({ item, onPress, more = 0, style }: {
  item: TripMediaItem;
  onPress: () => void;
  more?: number;
  style: { flex?: number; aspectRatio: number };
}) {
  const { c } = useTheme();
  const label = `${item.kind === "video" ? "Play video" : "Open photo"} from ${item.uploaderName}`;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ ...style, overflow: "hidden", borderRadius: radius.sm, backgroundColor: c["sheet-3"] }}>
      {item.kind === "photo" ? <Image source={{ uri: fullUrl(item.thumbUrl) }} style={{ width: "100%", height: "100%" }} resizeMode="cover" /> : null}
      {item.kind === "video" && more === 0 ? (
        <View style={{ position: "absolute", left: 4, bottom: 4, flexDirection: "row", alignItems: "center", gap: 3, height: 18, paddingHorizontal: 5, borderRadius: radius.pill, backgroundColor: c.sheet }}>
          <PlayGlyph color={c.ink} />
          <Text style={{ color: c.ink, fontFamily: fonts.type, fontSize: size.label }}>{videoClock(item.durationSeconds) ?? "Video"}</Text>
        </View>
      ) : null}
      {more > 0 ? (
        <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center", backgroundColor: `${c.sheet}C0` }}>
          <Text style={{ color: c.ink, fontFamily: fonts.type, fontSize: size.body }}>+{more}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function PhotoView({ entries, startId, canEdit, onClose, onDelete }: {
  entries: { item: TripMediaItem; place: string }[];
  startId: number;
  canEdit: boolean;
  onClose: () => void;
  onDelete: (id: number) => void;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [id, setId] = useState(startId);
  const index = Math.max(entries.findIndex((e) => e.item.id === id), 0);
  const entry = entries[index];
  if (!entry) return null;
  const step = (by: number) => setId(entries[(index + by + entries.length) % entries.length].item.id);
  const { item, place } = entry;
  const confirmDelete = () =>
    Alert.alert(item.kind === "video" ? "Delete this video?" : "Delete this photo?", "It goes for everyone on the trip.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDelete(item.id) },
    ]);
  return (
    <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.md, paddingHorizontal: space.md, gap: space.md, backgroundColor: c.sheet }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, paddingBottom: space.md, borderBottomWidth: 1, borderBottomColor: c.rule }}>
        {entries.length > 1 ? (
          <>
            <IconButton label="Previous" onPress={() => step(-1)}>{(ink) => <View style={{ transform: [{ rotate: "90deg" }] }}><ChevronGlyph color={ink} /></View>}</IconButton>
            <Text style={{ color: c["ink-2"], fontFamily: fonts.type, fontSize: size.label }}>{index + 1}/{entries.length}</Text>
            <IconButton label="Next" onPress={() => step(1)}>{(ink) => <View style={{ transform: [{ rotate: "-90deg" }] }}><ChevronGlyph color={ink} /></View>}</IconButton>
          </>
        ) : null}
        <Face name={item.uploaderName} size={22} />
        <Text numberOfLines={1} style={{ flex: 1, color: c.ink, fontFamily: fonts.sans, fontSize: size.small }}>{item.uploaderName}, {place}</Text>
        {item.mine && canEdit ? <IconButton label="Delete" tone="danger" onPress={confirmDelete}>{(ink) => <BinGlyph color={ink} />}</IconButton> : null}
        <IconButton label="Close" onPress={onClose}>{(ink) => <CrossGlyph color={ink} />}</IconButton>
      </View>
      {item.kind === "photo" ? (
        <Image source={{ uri: fullUrl(item.url) }} accessibilityLabel={`Photo from ${item.uploaderName}, ${place}`} style={{ flex: 1, borderRadius: radius.sm, backgroundColor: c["sheet-2"] }} resizeMode="contain" />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: c["sheet-2"] }}>
          <Button label="Play video" onPress={() => void openFileNatively(fullUrl(item.url), `floc-video-${item.id}.mp4`, item.mimeType)} />
        </View>
      )}
    </View>
  );
}

export function MediaGallery({ groups, start, canAdd, busy, line, failed, onAdd, onDelete, onClose }: {
  groups: MediaGroup<TripMediaItem>[];
  start: string;
  canAdd: boolean;
  busy: boolean;
  line: string | null;
  failed: boolean;
  onAdd: (placeId: number | null) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [current, setCurrent] = useState(start);
  const [viewing, setViewing] = useState<number | null>(null);
  const scroller = useRef<ScrollView>(null);
  const tops = useRef(new Map<string, number>());
  const placed = useRef(false);
  const entries = useMemo(() => groups.flatMap((g) => g.items.map((item) => ({ item, place: g.name }))), [groups]);
  const shown = groups.find((g) => g.key === current) ?? groups[0];
  const pinned = useRef(true);
  const jump = (key: string) => {
    pinned.current = true;
    setCurrent(key);
    scroller.current?.scrollTo({ y: tops.current.get(key) ?? 0, animated: true });
  };
  const follow = (y: number) => {
    if (pinned.current) return;
    const here = groups.filter((g) => (tops.current.get(g.key) ?? 0) <= y + 40).pop();
    if (here && here.key !== current) setCurrent(here.key);
  };
  return (
    <Modal visible animationType="slide" onRequestClose={viewing !== null ? () => setViewing(null) : onClose}>
      <View style={{ flex: 1, paddingTop: insets.top + space.md, paddingBottom: insets.bottom, paddingHorizontal: space.md, gap: space.md, backgroundColor: c.sheet }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, paddingBottom: space.md, borderBottomWidth: 1, borderBottomColor: c.rule }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ gap: space.xs }}>
            {groups.map((g) => {
              const on = g.key === current;
              return (
                <Pressable key={g.key} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => jump(g.key)} style={{ flexDirection: "row", alignItems: "center", gap: space.xs, height: 34, paddingHorizontal: space.sm, borderRadius: radius.sm, backgroundColor: on ? c["pen-2"] : "transparent" }}>
                  {g.no ? <Text style={{ color: on ? c["pen-deep"] : c["ink-2"], fontFamily: fonts.type, fontSize: size.label }}>{g.no}</Text> : null}
                  <Text style={{ color: on ? c["pen-deep"] : c["ink-2"], fontFamily: fonts.sans, fontSize: size.small }}>{g.name}</Text>
                  <Text style={{ color: on ? c["pen-deep"] : c["ink-3"], fontFamily: fonts.type, fontSize: size.label }}>{g.items.length}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {canAdd ? <IconButton label={`Add to ${shown.name}`} disabled={busy} onPress={() => onAdd(shown.placeId)}>{(ink) => <UploadGlyph color={ink} />}</IconButton> : null}
          <IconButton label="Close" onPress={onClose}>{(ink) => <CrossGlyph color={ink} />}</IconButton>
        </View>
        {line ? <Text style={{ color: failed ? c.red : c["ink-2"], fontFamily: fonts.sans, fontSize: size.label }}>{line}</Text> : null}
        <ScrollView ref={scroller} scrollEventThrottle={64} onScrollBeginDrag={() => { pinned.current = false; }} onScroll={(e) => follow(e.nativeEvent.contentOffset.y)} contentContainerStyle={{ gap: space.xl, paddingBottom: space.xl }}>
          {groups.map((g) => (
            <View
              key={g.key}
              onLayout={(e) => {
                tops.current.set(g.key, e.nativeEvent.layout.y);
                if (g.key === start && !placed.current) {
                  placed.current = true;
                  scroller.current?.scrollTo({ y: e.nativeEvent.layout.y, animated: false });
                }
              }}
              style={{ gap: space.sm }}
            >
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.sm }}>
                {g.no ? <Text style={{ color: c.pen, fontFamily: fonts.type, fontSize: size.small }}>{g.no}</Text> : null}
                <Text style={{ color: c.ink, fontFamily: fonts.sansBold, fontSize: size.heading }}>{g.name}</Text>
                <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.label }}>{g.items.length}</Text>
              </View>
              {fillRows(g.items.map((item) => ({ item, ratio: mediaRatio(item.width, item.height) })), width < 600 ? 2.4 : 4.6).map((row) => (
                <View key={row[0].item.id} style={{ flexDirection: "row", gap: space.xs }}>
                  {row.map(({ item, ratio }) => <MediaThumb key={item.id} item={item} style={{ flex: ratio, aspectRatio: ratio }} onPress={() => setViewing(item.id)} />)}
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
        {viewing !== null ? <PhotoView entries={entries} startId={viewing} canEdit={canAdd} onClose={() => setViewing(null)} onDelete={(id) => { onDelete(id); setViewing(null); }} /> : null}
      </View>
    </Modal>
  );
}
