/**
 * The trip list (#289). Each card carries the group's faces, the web card's status word and the
 * name as typed. Why New trip and Join sit at the top: at the foot of a long list they scrolled away.
 */
import { arrangeTripsHome } from "@floc/core/trip/trips-home";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";

import { FaceStack } from "@/components/system/face-stack";
import { ChevronGlyph, MoreGlyph, StarGlyph } from "@/components/system/glyphs";
import { TextLink } from "@/components/system/text-controls";
import { InviteBanner } from "@/components/trip/invite-banner";
import { TagPills } from "@/components/trip/tag-pills";
import { useTheme } from "@/components/system/theme";
import { TripSheet, draftFor, type TripDraft } from "@/components/trip/trip-sheet";
import { Body, Button, Card, Empty, Failed, Figure, Label, SectionTitle, Toggle } from "@/components/system/ui";
import { formatDateRange, fromIsoDate, splitEnded } from "@floc/core/dates/dates";
import { readTripColor, tripPastel } from "@floc/core/trip/trip-color";
import { pastelOf } from "@floc/core/design/pastels";
import { readTripMark } from "@floc/core/trip/mark/trip-mark";
import { TripMarkIcon } from "@/components/trip/trip-mark";

import type { AppRouter } from "@floc/api/router";
import type { inferRouterOutputs } from "@trpc/server";

import { trpc } from "@/lib/api";
import { tripCardStatus } from "@/lib/trip/card-status";
import { useTripWrite } from "@/lib/trip/trip-write";
import { fonts, radius, size, space } from "@/lib/theme";

type TripCard = inferRouterOutputs<AppRouter>["trips"]["list"][number];

export default function Trips() {
  const router = useRouter();
  const { c } = useTheme();
  const queryClient = useQueryClient();
  const trips = useQuery(trpc.trips.list.queryOptions({ archived: false }));
  const invites = useQuery(trpc.invites.mine.queryOptions());

  useFocusEffect(
    useCallback(() => {
      void trips.refetch();
      void invites.refetch();
    }, []),
  );

  const [chosen, setChosen] = useState<TripCard | null>(null);
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
  const toggleStar = (trip: TripCard) => star.mutate({ tripId: trip.id, starred: !trip.starred });

  if (trips.isPending) return <TripsSkeleton />;
  if (trips.isError) return <Failed onRetry={() => trips.refetch()} />;

  const { live, ended } = splitEnded(trips.data);
  const ordered = [...live].sort((a, b) =>
    a.startDate && b.startDate ? a.startDate.localeCompare(b.startDate) : a.startDate ? -1 : b.startDate ? 1 : 0,
  );
  const { featured, later, undated } = arrangeTripsHome(ordered);
  const rows = [...later, ...undated];
  const hasTrips = trips.data.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <FlatList
        data={rows}
        keyExtractor={(t) => String(t.id)}
        contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: space.xxl }}
        refreshControl={<RefreshControl refreshing={trips.isFetching} onRefresh={() => void trips.refetch()} />}
        ListHeaderComponent={
          <View style={{ gap: space.lg }}>
            {hasTrips ? (
              <View style={{ flexDirection: "row", gap: space.sm }}>
                <View style={{ flex: 1 }}>
                  <Button label="New trip" onPress={() => router.push("/(app)/new-trip")} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button label="Join with a link" variant="quiet" onPress={() => router.push("/(app)/join")} />
                </View>
              </View>
            ) : null}
            <InviteBanner
              invites={invites.data ?? []}
              busy={accept.isPending || decline.isPending}
              onAnswer={(tripId, join) => (join ? accept.mutate({ tripId }) : decline.mutate({ tripId }))}
            />
            {featured ? <FeaturedTrip trip={featured} onMenu={setChosen} onStar={toggleStar} /> : null}
          </View>
        }
        ListEmptyComponent={
          hasTrips ? null : (
            <View style={{ gap: space.sm }}>
              <Empty>No trips yet.</Empty>
              <Button label="Start a trip" onPress={() => router.push("/(app)/new-trip")} />
              <Button label="Borrow one from Explore" variant="quiet" onPress={() => router.push("/explore" as never)} />
              <Button label="Join with a link" variant="quiet" onPress={() => router.push("/(app)/join")} />
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <View style={{ gap: space.sm }}>
            {index === 0 && later.length > 0 ? <SectionTitle>Later</SectionTitle> : null}
            {index === later.length && undated.length > 0 ? <SectionTitle>No dates yet</SectionTitle> : null}
            <TripRow trip={item} onMenu={setChosen} onStar={toggleStar} />
          </View>
        )}
        ListFooterComponent={
          <View style={{ gap: space.md, paddingTop: space.lg }}>
            {ended.length > 0 ? (
              <Pressable
                onPress={() => setShowPast((open) => !open)}
                accessibilityRole="button"
                accessibilityState={{ expanded: showPast }}
                style={{ flexDirection: "row", alignItems: "center", gap: space.sm, paddingVertical: space.sm }}
              >
                <SectionTitle>Past trips</SectionTitle>
                <Figure tone="ink-3">{String(ended.length)}</Figure>
                <View style={{ flex: 1 }} />
                <ChevronGlyph color={c["ink-2"]} open={showPast} />
              </Pressable>
            ) : null}
            {showPast ? ended.map((t) => <TripRow key={t.id} trip={t} onMenu={setChosen} onStar={toggleStar} />) : null}
            {hasTrips ? <TextLink label="Archived trips" onPress={() => router.push("/(app)/archived")} /> : null}
          </View>
        }
      />
      {chosen !== null ? <TripMenu trip={chosen} onClose={() => setChosen(null)} /> : null}
    </View>
  );
}

const TARGET = { width: 44, height: 44, alignItems: "center", justifyContent: "center" } as const;

/** Star and menu as bare glyphs: a bordered box per action put boxes inside every card. */
function CardActions({ trip, tone, onMenu, onStar }: { trip: TripCard; tone: string; onMenu: () => void; onStar: () => void }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginVertical: -space.md, marginRight: -space.md }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={trip.starred ? `Unstar ${trip.name}` : `Star ${trip.name}`}
        accessibilityState={{ selected: trip.starred }}
        onPress={onStar}
        style={TARGET}
      >
        <StarGlyph color={trip.starred ? c[`${tone}-ink` as "ink"] : c["ink-3"]} on={trip.starred} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`More for ${trip.name}`} onPress={onMenu} style={TARGET}>
        <MoreGlyph color={c["ink-2"]} />
      </Pressable>
    </View>
  );
}

function TripRow({ trip, onMenu, onStar }: { trip: TripCard; onMenu: (trip: TripCard) => void; onStar: (trip: TripCard) => void }) {
  const { c } = useTheme();
  const tone = pastelOf(tripPastel(readTripColor(trip.colorKey), trip.id));
  const mark = readTripMark(trip.mark);
  return (
    <Link href={{ pathname: "/trip/[id]", params: { id: trip.id } }} asChild>
      <Pressable accessibilityLabel={trip.name} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
        <Card style={{ gap: space.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: c[tone], borderWidth: 1, borderColor: c[`${tone}-edge`] }} />
            {mark ? <TripMarkIcon mark={mark} color={c[`${tone}-ink`]} size={14} /> : null}
            <View style={{ flex: 1 }}>
              <Label>{tripCardStatus(trip)}</Label>
            </View>
            <CardActions trip={trip} tone={tone} onMenu={() => onMenu(trip)} onStar={() => onStar(trip)} />
          </View>
          <Text style={{ color: c.ink, fontFamily: fonts.display, fontSize: size.heading }}>{trip.name}</Text>
          <Text style={{ color: c["ink-2"], fontFamily: fonts.type, fontSize: size.small }}>
            {formatDateRange(trip.startDate, trip.endDate)}
          </Text>
          {trip.where ? <Body tone="ink-2">{trip.where}</Body> : null}
          <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: space.sm, paddingTop: space.xs }}>
            <FaceStack faces={trip.members} />
            <TagPills tags={trip.tags} color={readTripColor(trip.colorKey)} tripId={trip.id} />
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}

function FeaturedTrip({ trip, onMenu, onStar }: { trip: TripCard; onMenu: (trip: TripCard) => void; onStar: (trip: TripCard) => void }) {
  const { c } = useTheme();
  if (!trip.startDate) return null;
  const tone = pastelOf(tripPastel(readTripColor(trip.colorKey), trip.id));
  const date = fromIsoDate(trip.startDate);
  const month = date.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
  const status = tripCardStatus(trip);
  return (
    <Link href={{ pathname: "/trip/[id]", params: { id: trip.id } }} asChild>
      <Pressable accessibilityLabel={trip.name} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
        <Card style={{ gap: space.md, padding: space.lg }}>
          <View style={{ flexDirection: "row", gap: space.md }}>
            <View
              style={{
                width: 60,
                height: 64,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radius.sm,
                borderWidth: 1,
                borderColor: c[`${tone}-edge`],
                backgroundColor: c[tone],
              }}
            >
              <Text style={{ fontFamily: fonts.type, fontSize: size.display, lineHeight: 30, color: c[`${tone}-ink`] }}>
                {date.getUTCDate()}
              </Text>
              <Text style={{ fontFamily: fonts.type, fontSize: size.label, color: c[`${tone}-ink`] }}>{month.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, gap: space.xs }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Label>{status === "Happening now" ? status : `Next up · ${status}`}</Label>
                </View>
                <CardActions trip={trip} tone={tone} onMenu={() => onMenu(trip)} onStar={() => onStar(trip)} />
              </View>
              <Text style={{ fontFamily: fonts.display, fontSize: size.heading, color: c.ink }}>{trip.name}</Text>
              <Text style={{ color: c["ink-2"], fontFamily: fonts.type, fontSize: size.small }}>
                {formatDateRange(trip.startDate, trip.endDate)}
              </Text>
              {trip.where ? <Body tone="ink-2">{trip.where}</Body> : null}
            </View>
          </View>
          <FaceStack faces={trip.members} />
        </Card>
      </Pressable>
    </Link>
  );
}

/** Why: card-shaped placeholders hold the layout still while the list loads, where a spinner jumped it. */
function TripsSkeleton() {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.paper, padding: space.lg, gap: space.md }} accessibilityLabel="Loading your trips">
      {[120, 96, 96].map((height, i) => (
        <View key={i} style={{ height, borderRadius: radius.md, backgroundColor: c["sheet-2"] }} />
      ))}
    </View>
  );
}

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

  useEffect(() => {
    if (write.saved) onClose();
  }, [write.saved, onClose]);

  return (
    <TripSheet trip={shape(trip)} draft={draft} onChange={setDraft} onClose={onClose} write={write}>
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
