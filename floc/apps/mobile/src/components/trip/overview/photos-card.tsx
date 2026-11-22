import { groupMedia, VIDEO_LOCATION_NOTE, type MediaStop } from "@floc/core/media/media";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../system/theme";
import { IconButton, SectionTitle } from "../../system/ui";
import { MediaGallery, MediaThumb } from "./media-gallery";
import { pickAndSendMedia } from "./media-upload";
import { UploadGlyph } from "@/components/system/glyphs";
import { trpc } from "@/lib/api";
import { fonts, radius, size, space } from "@/lib/theme";

const SHOWN = 4;

export function PhotosCard({ tripId, stops }: { tripId: number; stops: MediaStop[] }) {
  const { c } = useTheme();
  const queryClient = useQueryClient();
  const media = useQuery(trpc.media.list.queryOptions({ tripId }));
  const [open, setOpen] = useState<string | null>(null);
  const [line, setLine] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: trpc.media.list.queryKey({ tripId }) });
  const remove = useMutation({
    ...trpc.media.remove.mutationOptions(),
    onSuccess: () => void refresh(),
    onError: () => { setFailed(true); setLine("That could not be deleted."); },
  });

  if (media.isError) {
    return (
      <View style={{ gap: space.sm }}>
        <SectionTitle>Photos</SectionTitle>
        <Text style={{ color: c.red, fontFamily: fonts.sans, fontSize: size.small }}>Photos could not load.</Text>
      </View>
    );
  }
  if (!media.data) return null;
  const { items, canAdd, uploadUrl, uploadToken } = media.data;
  const groups = groupMedia(items, stops);
  const videos = items.filter((m) => m.kind === "video").length;
  const photos = items.length - videos;
  const summary = [photos ? `${photos} photo${photos === 1 ? "" : "s"}` : "", videos ? `${videos} video${videos === 1 ? "" : "s"}` : ""].filter(Boolean).join(", ");
  const add = async (placeId: number | null) => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    setLine("Adding");
    try {
      const result = await pickAndSendMedia({ uploadUrl, uploadToken, placeId });
      setFailed(Boolean(result.problem));
      setLine(result.problem ?? (result.video ? VIDEO_LOCATION_NOTE : null));
      if (result.added > 0) void refresh();
    } catch {
      setFailed(true);
      setLine("That file could not be added.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.sm }}>
        <SectionTitle>Photos</SectionTitle>
        <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.label }}>{summary}</Text>
      </View>
      {line ? <Text style={{ color: failed ? c.red : c["ink-2"], fontFamily: fonts.sans, fontSize: size.label }}>{line}</Text> : null}
      <View style={{ backgroundColor: c.sheet, borderColor: c.rule, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, overflow: "hidden" }}>
        {groups.map((g, i) => (
          <View key={g.key} style={{ gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.md, borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth, borderTopColor: c.rule, backgroundColor: g.key === "trip" ? c["sheet-2"] : "transparent" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
              <Pressable accessibilityRole="button" accessibilityLabel={`Open ${g.name}`} onPress={() => setOpen(g.key)} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: space.md }}>
                {g.no ? <Text style={{ width: 16, color: c.pen, fontFamily: fonts.type, fontSize: size.body }}>{g.no}</Text> : null}
                <Text numberOfLines={1} style={{ flexShrink: 1, color: c.ink, fontFamily: fonts.sansBold, fontSize: size.body }}>{g.name}</Text>
                <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.label }}>{g.items.length}</Text>
              </Pressable>
              {canAdd ? <IconButton label={`Add to ${g.name}`} disabled={busy} onPress={() => void add(g.placeId)}>{(ink) => <UploadGlyph color={ink} />}</IconButton> : null}
            </View>
            {g.items.length > 0 ? (
              <View style={{ flexDirection: "row", gap: space.xs }}>
                {Array.from({ length: SHOWN }, (_, slot) => {
                  const item = g.items[slot];
                  if (!item) return <View key={slot} style={{ flex: 1, aspectRatio: 1 }} />;
                  return <MediaThumb key={item.id} item={item} style={{ flex: 1, aspectRatio: 1 }} more={slot === SHOWN - 1 ? Math.max(g.items.length - SHOWN, 0) : 0} onPress={() => setOpen(g.key)} />;
                })}
              </View>
            ) : null}
          </View>
        ))}
      </View>
      {open !== null ? (
        <MediaGallery groups={groups} start={open} canAdd={canAdd} busy={busy} line={line} failed={failed} onAdd={(placeId) => void add(placeId)} onDelete={(mediaId) => { setFailed(false); setLine(null); remove.mutate({ tripId, mediaId }); }} onClose={() => setOpen(null)} />
      ) : null}
    </View>
  );
}
