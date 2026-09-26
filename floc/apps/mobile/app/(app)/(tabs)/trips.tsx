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
import { titleCase } from "@floc/core/text/title-case";
import { arrangeTripsHome } from "@floc/core/trip/trips-home";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";

import { FlockChevronGlyph, MoreGlyph, StarGlyph } from "@/components/system/glyphs";
import { InviteBanner } from "@/components/trip/invite-banner";
import { TagPills } from "@/components/trip/tag-pills";
import { useTheme } from "@/components/system/theme";
import { TripSheet, draftFor, type TripDraft } from "@/components/trip/trip-sheet";
import { Body, Button, Card, Empty, Failed, Figure, IconButton, Label, Loading, Toggle } from "@/components/system/ui";
import { countdownLabel, formatDateRange, fromIsoDate, splitEnded } from "@floc/core/dates/dates";
import { tripListStage } from "@floc/core/trip/list-stage";
import { readTripColor, tripPastel } from "@floc/core/trip/trip-color";
import { pastelOf } from "@floc/core/design/pastels";
import { readTripMark } from "@floc/core/trip/mark/trip-mark";
import { TripMarkIcon } from "@/components/trip/trip-mark";

import type { AppRouter } from "@floc/api/router";
import type { inferRouterOutputs } from "@trpc/server";

import { trpc } from "@/lib/api";
import { useTripWrite } from "@/lib/trip/trip-write";
import { fonts, radius, space } from "@/lib/theme";

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
  const star = useMutation({ ...trpc.trips.setStarred.mutationOptions(), ...settled });
  const toggleStar = (trip: TripCard) =>
    star.mutate({ tripId: trip.id, starred: !trip.starred });

  if (trips.isPending) return <Loading />;
  if (trips.isError) return <Failed onRetry={() => trips.refetch()} />;

  const { live, ended } = splitEnded(trips.data);
  const ordered = [...live].sort((a, b) =>
    a.startDate && b.startDate
      ? a.startDate.localeCompare(b.startDate)
      : a.startDate ? -1 : b.startDate ? 1 : 0,
  );
  const { featured, later, undated } = arrangeTripsHome(ordered);
  const rows = [...later, ...undated];

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <FlatList
        data={rows}
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
          <View style={{ gap: space.lg }}>
            <InviteBanner
              invites={invites.data ?? []}
              busy={accept.isPending || decline.isPending}
              onAnswer={(tripId, join) =>
                join ? accept.mutate({ tripId }) : decline.mutate({ tripId })
              }
            />
            {featured ? (
              <FeaturedTrip trip={featured} onMenu={setChosen} onStar={toggleStar} />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          trips.data.length === 0 ? (
            <View style={{ gap: space.sm }}>
              <Empty>No trips yet.</Empty>
              <Button label="Start a trip" onPress={() => router.push("/(app)/new-trip")} />
              <Button
                label="Or borrow one from Explore"
                variant="quiet"
                onPress={() => router.push("/explore" as never)}
              />
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <View style={{ gap: space.sm }}>
            {index === 0 && later.length > 0 ? <Label>Later</Label> : null}
            {index === later.length && undated.length > 0 ? <Label>No dates yet</Label> : null}
            <TripRow trip={item} onMenu={setChosen} onStar={toggleStar} />
          </View>
        )}
        ListFooterComponent={
          <TripListFooter
            ended={ended}
            showPast={showPast}
            onTogglePast={() => setShowPast((open) => !open)}
            onMenu={setChosen}
            onStar={toggleStar}
            hasTrips={trips.data.length > 0}
          />
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
  onStar,
}: {
  trip: TripCard;
  onMenu: (trip: TripCard) => void;
  onStar: (trip: TripCard) => void;
}) {
  const { c } = useTheme();
  const tone = pastelOf(tripPastel(readTripColor(trip.colorKey), trip.id));
  const mark = readTripMark(trip.mark);
  return (
    <Link href={{ pathname: "/trip/[id]", params: { id: trip.id } }} asChild>
      <Pressable>
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <View style={{ flex: 1, gap: space.xs }}>
              {/* The mark rides on the stage line; the swatch carries colour (#318). */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
                <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: c[tone], borderWidth: 1, borderColor: c[`${tone}-edge`] }} />
                {mark ? <TripMarkIcon mark={mark} color={c[`${tone}-ink`]} size={14} /> : null}
                <Label>{tripListStage(trip)}</Label>
              </View>
              <Body bold>{titleCase(trip.name)}</Body>
              {/* Undated is normal, not an error (rule 9) — so it is said, not hidden. */}
              <Figure tone="ink-2">{formatDateRange(trip.startDate, trip.endDate)}</Figure>
            </View>
            <View style={{ gap: space.sm }}>
              <IconButton label={`More for ${trip.name}`} onPress={() => onMenu(trip)}>
                {(colour) => <MoreGlyph color={colour} />}
              </IconButton>
              <IconButton
                label={trip.starred ? `Unstar ${trip.name}` : `Star ${trip.name}`}
                on={trip.starred}
                onColor={tone}
                onPress={() => onStar(trip)}
              >
                {(colour) => <StarGlyph color={colour} on={trip.starred} />}
              </IconButton>
            </View>
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
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}

function TripListFooter({
  ended,
  showPast,
  onTogglePast,
  onMenu,
  onStar,
  hasTrips,
}: {
  ended: TripCard[];
  showPast: boolean;
  onTogglePast: () => void;
  onMenu: (trip: TripCard) => void;
  onStar: (trip: TripCard) => void;
  hasTrips: boolean;
}) {
  const router = useRouter();
  const { c } = useTheme();
  return (
    <View style={{ gap: space.sm, paddingTop: space.lg }}>
      {ended.length > 0 ? (
        <View style={{ gap: space.md, paddingBottom: space.md }}>
          <Pressable
            onPress={onTogglePast}
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
            ? ended.map((t) => (
                <TripRow key={t.id} trip={t} onMenu={onMenu} onStar={onStar} />
              ))
            : null}
        </View>
      ) : null}
      {hasTrips ? <Button label="New trip" onPress={() => router.push("/(app)/new-trip")} /> : null}
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <Button label="Join with a link" variant="quiet" onPress={() => router.push("/(app)/join")} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Archived" variant="quiet" onPress={() => router.push("/(app)/archived")} />
        </View>
      </View>
    </View>
  );
}

function FeaturedTrip({
  trip,
  onMenu,
  onStar,
}: {
  trip: TripCard;
  onMenu: (trip: TripCard) => void;
  onStar: (trip: TripCard) => void;
}) {
  const { c } = useTheme();
  if (!trip.startDate) return null;

  const tone = pastelOf(tripPastel(readTripColor(trip.colorKey), trip.id));
  const date = fromIsoDate(trip.startDate);
  const month = date.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
  const status = tripListStage(trip) === "Happening now"
    ? "Happening now"
    : `Next up${countdownLabel(trip.startDate) ? ` · ${countdownLabel(trip.startDate)}` : ""}`;

  return (
    <Link href={{ pathname: "/trip/[id]", params: { id: trip.id } }} asChild>
      <Pressable>
        <Card style={{ flexDirection: "row", gap: space.md, padding: space.lg }}>
          <View
            style={{
              width: 64,
              height: 64,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radius.sm,
              borderWidth: 1,
              borderColor: c[`${tone}-edge`],
              backgroundColor: c[tone],
            }}
          >
            <Text style={{ fontFamily: fonts.type, fontSize: 28, lineHeight: 32, color: c[`${tone}-ink`] }}>
              {date.getUTCDate()}
            </Text>
            <Text style={{ fontFamily: fonts.type, fontSize: 11, color: c[`${tone}-ink`] }}>
              {month.toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, gap: space.xs }}>
            <Label>{status}</Label>
            <Text style={{ fontFamily: fonts.display, fontSize: 23, lineHeight: 26, color: c.ink }}>
              {titleCase(trip.name)}
            </Text>
            <Figure tone="ink-2">{formatDateRange(trip.startDate, trip.endDate)}</Figure>
            <View style={{ flexDirection: "row", gap: space.sm, marginTop: space.sm }}>
              <IconButton label={`More for ${trip.name}`} onPress={() => onMenu(trip)}>
                {(colour) => <MoreGlyph color={colour} />}
              </IconButton>
              <IconButton
                label={trip.starred ? `Unstar ${trip.name}` : `Star ${trip.name}`}
                on={trip.starred}
                onColor={tone}
                onPress={() => onStar(trip)}
              >
                {(colour) => <StarGlyph color={colour} on={trip.starred} />}
              </IconButton>
            </View>
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
  const queryClient = useQueryClient();
  const [muted, setMuted] = useState(trip.muted);
  const mute = useMutation({
    ...trpc.trips.setMuted.mutationOptions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.trips.list.queryKey() }),
    onError: () => setMuted(trip.muted),
  });

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
    >
      <Toggle
        label="Mute this trip"
        value={muted}
        onChange={(next) => {
          setMuted(next);
          mute.mutate({ tripId: trip.id, muted: next });
        }}
      />
    </TripSheet>
  );
}

/** This list is the unarchived one, so `archived` is known without asking. */
function shape(trip: TripCard) {
  return {
    id: trip.id,
    name: trip.name,
    colorKey: trip.colorKey,
    mark: trip.mark,
    tags: trip.tags,
    role: trip.role,
    archived: false,
  };
}
