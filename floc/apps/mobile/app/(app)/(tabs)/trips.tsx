/**
 * The trip list — the screen the tracer bullet was aimed at (ticket 289).
 *
 * One tRPC read, rendered with the same vocabulary the web app uses — dates go
 * through `@floc/core/dates`, so "Dates not set" reads identically on a phone
 * and in a browser. Nothing about how a trip reads is re-decided here.
 *
 * THE CARD HAS A MENU. The web card carries rename, colour, archive and delete
 * behind its three dots; the phone had them only inside the trip, which meant
 * archiving one from the list was three screens. Same sheet, same writes, one
 * tap — `TripSheet` and `useTripWrite` are shared with the trip's header.
 *
 * IT RE-READS ITSELF. A trip deleted in a browser is still on this list until
 * something asks again, so it asks: on focus, on returning to the app, and on
 * a slow tick while you are looking at it (see `api.ts`).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";

import { FlockChevronGlyph, MoreGlyph } from "@/components/system/glyphs";
import { InviteBanner } from "@/components/trip/invite-banner";
import { TagPills } from "@/components/trip/tag-pills";
import { useTheme } from "@/components/system/theme";
import { TripSheet, draftFor, type TripDraft } from "@/components/trip/trip-sheet";
import { Body, Button, Card, Empty, Failed, Figure, IconButton, Loading, Pill } from "@/components/system/ui";
import { formatDateRange, splitEnded } from "@floc/core/dates/dates";
import { readTripColor, tripPastel } from "@floc/core/trip/trip-color";

import type { AppRouter } from "@floc/api/router";
import type { inferRouterOutputs } from "@trpc/server";

import { trpc } from "@/lib/api";
import { useTripWrite } from "@/lib/trip-write";
import { space } from "@/lib/theme";

/** One row of `trips.list`, named so the card, its menu and its writes agree on the shape. */
type TripCard = inferRouterOutputs<AppRouter>["trips"]["list"][number];

export default function Trips() {
  const router = useRouter();
  const { c } = useTheme();
  const queryClient = useQueryClient();
  const trips = useQuery(trpc.trips.list.queryOptions({ archived: false }));
  // Invites are a second read rather than a field on the list: they are almost
  // always empty, and a list that fails because nobody asked you anything is
  // worse than a banner that quietly does not draw.
  const invites = useQuery(trpc.invites.mine.queryOptions());

  // Coming back to this tab is the moment you most expect it to be true.
  useFocusEffect(
    useCallback(() => {
      void trips.refetch();
      void invites.refetch();
      // Refetching is what focus means here; the queries themselves are stable.
      }, []),
  );

  /** The trip whose menu is open, held whole so the sheet survives a re-read of the list. */
  const [chosen, setChosen] = useState<TripCard | null>(null);
  /** Past trips start folded — they are yours, but they are not what you opened the app for. */
  const [showPast, setShowPast] = useState(false);

  const settled = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.invites.mine.queryKey() });
      queryClient.invalidateQueries({ queryKey: trpc.trips.list.queryKey() });
    },
  };
  const accept = useMutation({ ...trpc.invites.accept.mutationOptions(), ...settled });
  const decline = useMutation({ ...trpc.invites.decline.mutationOptions(), ...settled });

  if (trips.isPending) return <Loading />;
  if (trips.isError) return <Failed onRetry={() => trips.refetch()} />;

  const { live, ended } = splitEnded(trips.data);

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <FlatList
        data={live}
        keyExtractor={(t) => String(t.id)}
        contentContainerStyle={{ padding: space.lg, gap: space.md }}
        refreshControl={
          <RefreshControl
            refreshing={trips.isFetching}
            onRefresh={() => {
              trips.refetch();
            }}
          />
        }
        ListHeaderComponent={
          <InviteBanner
            invites={invites.data ?? []}
            busy={accept.isPending || decline.isPending}
            onAnswer={(tripId, join) =>
              join ? accept.mutate({ tripId }) : decline.mutate({ tripId })
            }
          />
        }
        ListEmptyComponent={<Empty>No trips yet.</Empty>}
        renderItem={({ item }) => <TripRow trip={item} onMenu={setChosen} />}
        ListFooterComponent={
          <View style={{ gap: space.sm, paddingTop: space.lg }}>
            {ended.length > 0 ? (
              <View style={{ gap: space.md, paddingBottom: space.md }}>
                <Pressable
                  onPress={() => setShowPast((open) => !open)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: showPast }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: space.sm,
                    paddingVertical: space.sm,
                  }}
                >
                  <FlockChevronGlyph color={c["ink-2"]} open={showPast} />
                  <Figure tone="ink-2">{`Past trips · ${ended.length}`}</Figure>
                </Pressable>
                {showPast
                  ? ended.map((t) => <TripRow key={t.id} trip={t} onMenu={setChosen} />)
                  : null}
              </View>
            ) : null}
            <Button label="New trip" onPress={() => router.push("/(app)/new-trip")} />
            {/* Two rare, short jobs on one line — three stacked bars gave a
                once-a-month button the same shout as the one you came for. */}
            <View style={{ flexDirection: "row", gap: space.sm }}>
              <View style={{ flex: 1 }}>
                <Button
                  label="Join with a link"
                  variant="quiet"
                  onPress={() => router.push("/(app)/join")}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Archived"
                  variant="quiet"
                  onPress={() => router.push("/(app)/archived")}
                />
              </View>
            </View>
          </View>
        }
      />

      {/* Mounted only while a card is open, so its writes are aimed at one
          trip — the hook cannot be pointed at a different id mid-life. */}
      {chosen !== null ? (
        <TripMenu trip={chosen} onClose={() => setChosen(null)} />
      ) : null}
    </View>
  );
}

/** One trip's card — the live list and the past fold draw the same row. */
function TripRow({
  trip,
  onMenu,
}: {
  trip: TripCard;
  onMenu: (trip: TripCard) => void;
}) {
  const { c } = useTheme();
  // The chosen colour, or the id rotation still filling in (#213). It is a
  // rail, not a wash: a card tinted edge to edge would fight the tag pills
  // wearing the same pastel.
  const tone = tripPastel(readTripColor(trip.colorKey), trip.id);
  return (
    <Link href={{ pathname: "/trip/[id]", params: { id: trip.id } }} asChild>
      <Pressable>
        <Card style={{ borderLeftWidth: 4, borderLeftColor: c[tone] }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <View style={{ flex: 1, gap: space.xs }}>
              <Body bold>{trip.name}</Body>
              {/* Undated is normal, not an error (rule 9) — so it is said, not hidden. */}
              <Figure tone="ink-2">{formatDateRange(trip.startDate, trip.endDate)}</Figure>
            </View>
            <IconButton label={`More for ${trip.name}`} onPress={() => onMenu(trip)}>
              {(colour) => <MoreGlyph color={colour} />}
            </IconButton>
          </View>
          {/* Tags and the role share a line: two short things, and the role on
              its own row was a whole line for one word. */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              flexWrap: "wrap",
              gap: space.sm,
            }}
          >
            <TagPills tags={trip.tags} color={readTripColor(trip.colorKey)} tripId={trip.id} />
            {trip.role === "admin" ? <Pill word="Admin" tone="peri" /> : null}
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}

/** One card's sheet: the same rename, colour, tags, archive and delete the trip's header opens. */
function TripMenu({ trip, onClose }: { trip: TripCard; onClose: () => void }) {
  const [draft, setDraft] = useState<TripDraft | null>(() => draftFor(shape(trip)));
  const write = useTripWrite(trip.id, onClose);

  // A save that landed has nothing left to show, and leaving the sheet open on
  // a stale draft is how you save the same name twice.
  useEffect(() => {
    if (write.saved) onClose();
  }, [write.saved, onClose]);

  return (
    <TripSheet
      trip={shape(trip)}
      draft={draft}
      onChange={setDraft}
      onClose={onClose}
      write={write}
    />
  );
}

/** This list is the unarchived one, so `archived` is known without asking. */
function shape(trip: TripCard) {
  return {
    name: trip.name,
    colorKey: trip.colorKey,
    tags: trip.tags,
    role: trip.role,
    archived: false,
  };
}
