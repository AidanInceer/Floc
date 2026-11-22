import { markedUserIds } from "@floc/core/dates/availability";
import { nightsBetween } from "@floc/core/dates/dates";
import { yourPosition } from "@floc/core/money/position";
import { today } from "@floc/core/dates/dates";
import { toDoFrom } from "@floc/core/trip/overview/to-do-from";
import type { Gap } from "@floc/core/trip/overview/to-do";
import { groupStatuses } from "@floc/core/trip/group/group-status";
import { INVITE_LINK_RESET } from "@floc/core/trip/group/invite-link";
import { pastelOf } from "@floc/core/design/pastels";
import { readTripColor, tripPastel } from "@floc/core/trip/trip-color";
import { transportModes, tripLegs } from "@floc/core/trip/overview/legs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, View, type LayoutChangeEvent } from "react-native";

import { GoingLine } from "@/components/trip/going-section";
import { IdeasSection } from "@/components/trip/ideas/ideas-section";
import { EstimateRow } from "@/components/trip/overview/estimate-row";
import { ToDoBanner } from "@/components/trip/to-do-banner";
import { BookingsCard } from "@/components/trip/overview/bookings-card";
import { PhotosCard } from "@/components/trip/overview/photos-card";
import { shortPlace } from "@floc/core/itinerary/names/place-name";
import { FilesLine } from "@/components/trip/overview/files-line";
import { OverviewCard } from "@/components/trip/overview-card";
import { RecapFoot } from "@/components/trip/overview/recap-foot";
import { recapShows } from "@floc/core/trip/overview/recap";
import { ideasStartOpen } from "@floc/core/trip/ideas";
import { TripMapSection } from "@/components/trip/route/trip-map-section";
import { StopList } from "@/components/trip/stops/stop-list";
import { TripSheet, draftFor, type TripDraft } from "@/components/trip/trip-sheet";
import { QuietAction } from "@/components/system/text-controls";
import { Failed, Loading, SectionTitle } from "@/components/system/ui";
import type { AppRouter } from "@floc/api/router";
import type { inferRouterOutputs } from "@trpc/server";

import { trpc } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { routeOf } from "@/lib/trip/overview-route";
import { bagOf, toDoGo, type OverviewSection } from "@/lib/trip/to-do-go";
import { useTripWrite } from "@/lib/trip/trip-write";
import { space } from "@/lib/theme";

type Outputs = inferRouterOutputs<AppRouter>;

export default function Overview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  const ready = Number.isFinite(tripId);
  const router = useRouter();

  const trip = useQuery(trpc.trips.get.queryOptions({ tripId }, { enabled: ready }));
  const places = useQuery(trpc.places.list.queryOptions({ tripId }, { enabled: ready }));
  const files = useQuery(trpc.files.list.queryOptions({ tripId }, { enabled: ready }));
  const ledger = useQuery(trpc.money.ledger.queryOptions({ tripId }, { enabled: ready }));
  const pairs = useQuery(trpc.money.pairs.queryOptions({ tripId }, { enabled: ready }));
  const days = useQuery(trpc.itinerary.days.queryOptions({ tripId }, { enabled: ready }));
  const { data: session } = useSession();
  const availability = useQuery(trpc.availability.list.queryOptions({ tripId }, { enabled: ready }));
  const [draft, setDraft] = useState<TripDraft | null>(null);
  const scroll = useRef<ScrollView>(null);
  const sections = useRef(new Map<OverviewSection, number>());
  const mark = (section: OverviewSection) => (e: LayoutChangeEvent) => void sections.current.set(section, e.nativeEvent.layout.y);

  if (trip.isPending) return <Loading />;
  if (trip.isError) return <Failed onRetry={() => trip.refetch()} />;

  const go = (route: string) => router.push(`/trip/${tripId}/${route}` as never);
  const openDay = (date: string) => router.push({ pathname: "/trip/[id]/days", params: { id: tripId, date } });
  const { legs, wholeTrip } = tripLegsFrom(days.data, files.data, trip.data.endDate);
  const route = routeOf(legs, days.data ?? [], places.data ?? []);
  const events = new Map((days.data ?? []).map((d) => [d.id, d.events]));
  const onGo = (gap: Gap) => {
    const where = toDoGo(gap);
    if ("tab" in where) return go(where.tab);
    scroll.current?.scrollTo({ y: sections.current.get(where.section) ?? 0, animated: false });
  };

  return (
    <ScrollView ref={scroll} contentContainerStyle={{ padding: space.lg, gap: space.xl }}>
      <ToDoLine tripId={tripId} trip={trip.data} legs={legs} onGo={onGo} />

      <OverviewCard
        trip={trip.data}
        nights={nightsOf(trip.data)}
        position={positionOf(ledger.data, pairs.data, session?.user.id)}
        onEdit={() => setDraft(draftFor(trip.data))}
        onDates={() => go("dates")}
        onMoney={() => go("money")}
        recap={recapShows(trip.data.endDate, today()) ? <RecapFoot tripId={tripId} tripName={trip.data.name} others={othersOf(trip.data, session?.user.id)} /> : null}
        files={<FilesLine tripId={tripId} files={files.data} failed={files.isError} onRetry={() => void files.refetch()} onOpen={() => go("files")} />}
      >
        <EstimateRow tripId={tripId} onOpen={() => router.push({ pathname: "/trip/[id]/money", params: { id: tripId, view: "budget" } })} />
        <GoingLine
          people={trip.data.members}
          statuses={statusesFor(trip.data, availability.data)}
          onOpen={() => go("roster")}
          onInvite={() => router.push(`/trip/${tripId}/invite`)}
        />
      </OverviewCard>

      <TripMapSection route={route} tone={pastelOf(tripPastel(readTripColor(trip.data.colorKey), tripId))} />

      <View onLayout={mark("ideas")}>
        {days.isPending ? <Loading /> : (
          <IdeasSection
            tripId={tripId}
            startOpen={ideasStartOpen({ startDate: trip.data.startDate, endDate: trip.data.endDate, days: days.data ?? [] })}
            days={days.data ?? []}
          />
        )}
      </View>

      {legs.length > 0 ? <BookingsCard tripId={tripId} legs={legs} wholeTrip={wholeTrip} onOpenFiles={() => go("files")} /> : null}

      <PhotosCard tripId={tripId} stops={legs.map((leg) => ({ placeId: leg.placeId, no: leg.no, name: shortPlace(leg.placeName) }))} />

      {legs.length > 0 ? (
        <View style={{ gap: space.sm }}>
          <SectionTitle>Stops</SectionTitle>
          <StopList legs={legs} events={events} onOpen={openDay} />
        </View>
      ) : null}

      {draft !== null ? (
        <EditSheet
          trip={trip.data}
          draft={draft}
          onChange={setDraft}
          onClose={() => setDraft(null)}
          onGone={() => router.replace("/trips" as never)}
        />
      ) : null}
    </ScrollView>
  );
}

function othersOf(trip: Outputs["trips"]["get"], viewerId: string | undefined) {
  return trip.members.filter((m) => m.userId !== viewerId).map((m) => ({ id: m.userId, name: m.name }));
}

function nightsOf(trip: Outputs["trips"]["get"]) {
  return trip.startDate && trip.endDate ? nightsBetween(trip.startDate, trip.endDate) : 0;
}

function positionOf(ledger: Outputs["money"]["ledger"] | undefined, pairs: Outputs["money"]["pairs"] | undefined, viewerId: string | undefined) {
  return ledger && ledger.expenses.length > 0 && pairs && viewerId ? yourPosition(pairs.rows, viewerId) : null;
}

function tripLegsFrom(
  days: Outputs["itinerary"]["days"] | undefined,
  files: Outputs["files"]["list"] | undefined,
  tripEnd: string | null,
) {
  return tripLegs({
    tripEnd,
    days: (days ?? []).map((d) => ({ dayId: d.id, date: d.date, overnightPlaceId: d.overnightPlaceId, placeName: d.overnightPlaceName })),
    modes: transportModes(days ?? []),
    files: files ?? [],
  });
}

function EditSheet({
  trip,
  draft,
  onChange,
  onClose,
  onGone,
}: {
  trip: Outputs["trips"]["get"];
  draft: TripDraft;
  onChange: (draft: TripDraft) => void;
  onClose: () => void;
  onGone: () => void;
}) {
  const write = useTripWrite(trip.id, onGone);
  const queryClient = useQueryClient();
  const resetLink = useMutation({
    ...trpc.invites.resetLink.mutationOptions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.invites.forTrip.queryKey({ tripId: trip.id }) }),
  });

  useEffect(() => {
    if (write.saved) onClose();
  }, [write.saved, onClose]);

  return (
    <TripSheet trip={trip} draft={draft} onChange={onChange} onClose={onClose} write={write}>
      {trip.role === "admin" ? (
        <QuietAction
          label={resetLink.isPending ? "Resetting…" : "Reset invite link"}
          disabled={resetLink.isPending}
          onPress={() =>
            Alert.alert(
              "Reset the invite link?",
              INVITE_LINK_RESET,
              [
                { text: "Cancel", style: "cancel" },
                { text: "Reset the link", style: "destructive", onPress: () => resetLink.mutate({ tripId: trip.id }) },
              ],
            )
          }
        />
      ) : null}
    </TripSheet>
  );
}

function statusesFor(trip: Outputs["trips"]["get"], availability: Outputs["availability"]["list"] | undefined) {
  const undated = !trip.startDate && !trip.endDate;
  const marked = new Set((availability ?? []).map((row) => row.userId));
  return groupStatuses({
    needDates: undated && availability ? trip.members.map((m) => m.userId).filter((id) => !marked.has(id)) : [],
    owing: [],
  });
}

function ToDoLine({
  tripId,
  trip,
  legs,
  onGo,
}: {
  tripId: number;
  trip: Outputs["trips"]["get"];
  legs: ReturnType<typeof tripLegsFrom>["legs"];
  onGo: (gap: Gap) => void;
}) {
  const { data: session } = useSession();
  const pairs = useQuery(trpc.money.pairs.queryOptions({ tripId }));
  const availability = useQuery(trpc.availability.list.queryOptions({ tripId }));
  const packing = useQuery(trpc.packing.list.queryOptions({ tripId }));
  const ideas = useQuery(trpc.ideas.list.queryOptions({ tripId }));
  const nudges = useQuery(trpc.nudges.targets.queryOptions({ tripId }));
  if (!pairs.data || !availability.data || !packing.data || !ideas.data || !session) return null;
  const list = toDoFrom({
    trip,
    today: today(),
    viewerId: session.user.id,
    members: trip.members,
    markedUserIds: markedUserIds(availability.data),
    ideas: ideas.data,
    settle: pairs.data.rows,
    bag: bagOf(packing.data.mine),
    shared: packing.data.shared.map((l) => ({ label: l.label, claimed: l.claims.length > 0 })),
    legs,
    nudges: nudges.data,
  });
  return <ToDoBanner tripId={tripId} list={list} onGo={onGo} />;
}
