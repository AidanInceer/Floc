/**
 * Trip Overview (tickets 291, 296) — the trip's *who, where and what*; Days is
 * its *when*. Undated opens here and is never an error (rules 4 and 9), and a
 * stop is derived from the days, never stored (rule 3).
 */
import { nightsBetween } from "@floc/core/dates/dates";
import { yourPosition } from "@floc/core/money/position";
import { today } from "@floc/core/dates/dates";
import { leftToSortFrom } from "@floc/core/trip/overview/left-to-sort-from";
import type { Gap } from "@floc/core/trip/overview/left-to-sort";
import { groupStatuses } from "@floc/core/trip/group/group-status";
import { pastelOf } from "@floc/core/design/pastels";
import { readTripColor, tripPastel } from "@floc/core/trip/trip-color";
import { transportModes, tripLegs } from "@floc/core/trip/overview/legs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";

import { GoingLine } from "@/components/trip/going-section";
import { IdeasSection } from "@/components/trip/ideas/ideas-section";
import { LeftToSort } from "@/components/trip/left-to-sort";
import { BookingsCard } from "@/components/trip/overview/bookings-card";
import { FilesLine } from "@/components/trip/overview/files-line";
import { OverviewCard } from "@/components/trip/overview-card";
import { TodaySection, TripMapSection } from "@/components/trip/route/trip-map-section";
import { StopList } from "@/components/trip/stops/stop-list";
import { TripSheet, draftFor, type TripDraft } from "@/components/trip/trip-sheet";
import { QuietAction } from "@/components/system/text-controls";
import { Failed, Loading, SectionTitle } from "@/components/system/ui";
import type { AppRouter } from "@floc/api/router";
import type { inferRouterOutputs } from "@trpc/server";

import { trpc } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { routeOf } from "@/lib/trip/overview-route";
import { useTripWrite } from "@/lib/trip/trip-write";
import { space } from "@/lib/theme";

type Outputs = inferRouterOutputs<AppRouter>;

export default function Overview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  // A screen keeps rendering for a frame while it leaves, and `id` is gone by
  // then: NaN goes down the wire as null and the server rightly refuses it.
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

  if (trip.isPending) return <Loading />;
  if (trip.isError) return <Failed onRetry={() => trip.refetch()} />;

  const go = (route: string) => router.push(`/trip/${tripId}/${route}` as never);
  const openDay = (date: string) => router.push({ pathname: "/trip/[id]/days", params: { id: tripId, date } });
  const { legs, wholeTrip } = tripLegsFrom(days.data, files.data, trip.data.endDate);
  const route = routeOf(legs, days.data ?? [], places.data ?? []);
  const events = new Map((days.data ?? []).map((d) => [d.id, d.events]));

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.xl }}>
      <TodaySection trip={trip.data} days={days.data} files={files.data} onOpenDay={openDay} />

      <SortLine tripId={tripId} trip={trip.data} legs={legs} onGo={go} />

      <OverviewCard
        trip={trip.data}
        nights={nightsOf(trip.data)}
        position={positionOf(ledger.data, pairs.data, session?.user.id)}
        onEdit={() => setDraft(draftFor(trip.data))}
        onDates={() => go("dates")}
        onMoney={() => go("money")}
        files={<FilesLine tripId={tripId} files={files.data} failed={files.isError} onRetry={() => void files.refetch()} onOpen={() => go("files")} />}
      >
        <GoingLine
          people={trip.data.members}
          statuses={statusesFor(trip.data, availability.data)}
          onOpen={() => go("roster")}
          onInvite={() => router.push(`/trip/${tripId}/invite`)}
        />
      </OverviewCard>

      <TripMapSection trip={trip.data} route={route} tone={pastelOf(tripPastel(readTripColor(trip.data.colorKey), tripId))} />

      {/* Ideas first while undated: before the dates exist it is the only live question here. */}
      <IdeasSection tripId={tripId} datesUnset={!trip.data.startDate && !trip.data.endDate} />

      {legs.length > 0 ? <BookingsCard tripId={tripId} legs={legs} wholeTrip={wholeTrip} onOpenFiles={() => go("files")} /> : null}

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

function nightsOf(trip: Outputs["trips"]["get"]) {
  return trip.startDate && trip.endDate ? nightsBetween(trip.startDate, trip.endDate) : 0;
}

/** The server's payments, so this matches Money to the penny (#463). */
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

/** The trip's own sheet — the same one the trips list opens — plus the invite link's reset, an admin power (#358). */
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

  // A save that landed has nothing left to show.
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
              "The old link stops working for anyone still holding it. Everyone already on the trip stays.",
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

// "Settling up" is the Money tab's to say; the group only waits on dates here.
function statusesFor(trip: Outputs["trips"]["get"], availability: Outputs["availability"]["list"] | undefined) {
  const undated = !trip.startDate && !trip.endDate;
  const marked = new Set((availability ?? []).map((row) => row.userId));
  return groupStatuses({
    needDates: undated && availability ? trip.members.map((m) => m.userId).filter((id) => !marked.has(id)) : [],
    owing: [],
  });
}

/** #460: the same list as the web, from the queries the screen shares (React Query reads each once). */
function SortLine({
  tripId,
  trip,
  legs,
  onGo,
}: {
  tripId: number;
  trip: Outputs["trips"]["get"];
  legs: ReturnType<typeof tripLegsFrom>["legs"];
  onGo: (route: string) => void;
}) {
  const { data: session } = useSession();
  const pairs = useQuery(trpc.money.pairs.queryOptions({ tripId }));
  const availability = useQuery(trpc.availability.list.queryOptions({ tripId }));
  const packing = useQuery(trpc.packing.list.queryOptions({ tripId }));
  const ideas = useQuery(trpc.ideas.list.queryOptions({ tripId }));
  if (!pairs.data || !availability.data || !packing.data || !ideas.data || !session) return null;
  const list = leftToSortFrom({
    trip,
    today: today(),
    viewerId: session.user.id,
    members: trip.members,
    markedUserIds: availability.data.filter((r) => r.available).map((r) => r.userId),
    ideas: ideas.data,
    settle: pairs.data.rows,
    shared: packing.data.shared.map((l) => ({ label: l.label, claimed: l.claims.length > 0 })),
    legs,
  });
  // Overview and Ideas are this screen; their gaps are already in view below.
  const go = (gap: Gap) => (gap.tab === "overview" || gap.tab === "ideas" ? undefined : onGo(gap.tab));
  return <LeftToSort list={list} onGo={go} />;
}
