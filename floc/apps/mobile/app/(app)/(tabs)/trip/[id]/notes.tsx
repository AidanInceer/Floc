/**
 * Notes (#408) — the trip's pages, the same editor as the website. The page is
 * drawn in a web view (an Expo DOM component) so the phone gets every block,
 * table and comment; the app holds the live doc, the socket and the copy kept
 * offline. The Pages button opens the list as a sheet, and the tab reopens the
 * last page you had open.
 */
import { LIVE_STATUS_WORDS } from "@floc/core/notes/live/live-status";
import { LINK_TABS, type LinkKind } from "@floc/core/notes/pages/trip-links";
import { useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";

import { PresenceRow } from "@/components/notes/live-presence";
import PageDom, { type PageHandle } from "@/components/notes/page-dom";
import { PagesSheet, type SheetActions } from "@/components/notes/pages-sheet";
import { useLivePage, useNotesSocket, usePageList } from "@/components/notes/use-live-notes";
import { useNotesData } from "@/components/notes/use-notes-data";
import { usePageRelay } from "@/components/notes/use-page-relay";
import { useTheme } from "@/components/system/theme";
import { Body, Button, Failed, Loading } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { wholeDoc } from "@/lib/notes/relay";
import { space } from "@/lib/theme";

const lastKey = (tripId: number) => `floc.notes.last.${tripId}`;

function useOpenPage(tripId: number, pageIds: number[] | undefined): [number | null, (id: number) => void] {
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => {
    if (!pageIds?.length || (open !== null && pageIds.includes(open))) return;
    // A store that will not open costs the last page, never the tab (rule 11).
    SecureStore.getItemAsync(lastKey(tripId))
      .then((saved) => setOpen(pageIds.find((id) => id === Number(saved)) ?? pageIds[0]))
      .catch(() => setOpen(pageIds[0]));
  }, [tripId, pageIds, open]);
  const choose = useCallback((id: number) => {
    setOpen(id);
    void SecureStore.setItemAsync(lastKey(tripId), String(id)).catch(() => {});
  }, [tripId]);
  return [open, choose];
}

export default function Notes() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  const router = useRouter();
  const { theme } = useTheme();
  const { data: session } = useSession();
  const viewer = useMemo(() => (session?.user ? { id: session.user.id, name: session.user.name } : null), [session?.user.id, session?.user.name]);
  const [sheet, setSheet] = useState(false);
  const listed = useQuery(trpc.pages.list.queryOptions({ tripId }, { enabled: Number.isFinite(tripId) }));
  const ids = useMemo(() => listed.data?.pages.map((p) => p.id), [listed.data]);
  const [open, choose] = useOpenPage(tripId, ids);
  const data = useNotesData(tripId, open);
  const socket = useNotesSocket();
  const byPage = usePageList(socket, tripId, open, viewer, data.refresh);
  const live = useLivePage(socket, tripId, open);
  const view = useRef<PageHandle | null>(null);
  const relay = usePageRelay(live, view);
  const liveDoc = live?.doc;
  const start = useMemo(() => (liveDoc ? wholeDoc(liveDoc) : ""), [liveDoc]);
  const page = data.list.data?.pages.find((p) => p.id === open);

  const openLink = useCallback(async (kind: LinkKind) => {
    const tab = LINK_TABS[kind];
    router.push((tab === "overview" ? `/trip/${tripId}` : `/trip/${tripId}/${tab}`) as never);
  }, [router, tripId]);

  const actions: SheetActions = {
    open: choose,
    add: (parentId) => void data.create(parentId).then((made) => { if (made) { choose(made); setSheet(false); } }),
    rename: data.rename,
    icon: (pageId, icon) => void data.setIcon(pageId, icon),
    move: (pageId, beforeId) => void data.move(pageId, beforeId),
    archive: (pageId) => void data.archive(pageId).then((refused) => {
      if (!refused && pageId === open) choose(data.list.data?.pages.find((p) => p.id !== pageId && p.parentId !== pageId)?.id ?? pageId);
    }),
    restore: (pageId) => void data.restore(pageId),
  };

  if (data.list.isError) return <Failed onRetry={() => void data.list.refetch()} />;
  if (!data.list.data || !page || !viewer) return <Loading />;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.lg, paddingVertical: space.sm }}>
        <Button label="Pages" variant="quiet" fit="small" onPress={() => setSheet(true)} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          <PresenceRow people={live?.people ?? []} />
          <Body tone="ink-3">{LIVE_STATUS_WORDS[live?.status ?? "saving"]}</Body>
        </View>
      </View>
      {live ? (
        <PageDom
          key={live.name}
          ref={view}
          dom={{ style: { flex: 1 }, scrollEnabled: true, keyboardDisplayRequiresUserAction: false }}
          start={start}
          theme={theme}
          me={viewer}
          foldKey={`${tripId}:${page.id}`}
          title={page.title}
          icon={page.icon}
          links={data.links}
          threads={data.threads}
          onReady={relay.onReady}
          onChange={relay.onChange}
          onPresence={relay.onPresence}
          onOpenLink={openLink}
          onRename={async (title) => { await data.rename(page.id, title).catch(() => {}); }}
          onIcon={async (icon) => { await data.setIcon(page.id, icon); }}
          onStartThread={data.startThread}
          onReply={data.reply}
          onResolve={data.resolve}
        />
      ) : (
        <Loading />
      )}
      <PagesSheet
        open={sheet}
        onClose={() => setSheet(false)}
        pages={data.list.data.pages}
        archived={data.list.data.archived}
        openId={open}
        byPage={byPage}
        error={data.error}
        actions={actions}
      />
    </View>
  );
}
