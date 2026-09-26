/**
 * Trip Overview (tickets 291, 296) — the trip's *who, where and what*; Days is
 * its *when*. Undated opens here and is never an error (rules 4 and 9), and a
 * stop is derived from the days, never stored (rule 3).
 */
import { spendHeadline } from "@floc/core/money/spend";
import { groupStatuses } from "@floc/core/trip/group/group-status";
import { transportModes, tripLegs } from "@floc/core/trip/overview/legs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";

import { FileList } from "@/components/files/file-list";
import { GroupActions } from "@/components/trip/group-actions";
import { IdeasSection } from "@/components/trip/ideas/ideas-section";
import { LegList } from "@/components/trip/leg-list";
import { OverviewCard } from "@/components/trip/overview-card";
import { RouteMap } from "@/components/map/route-map";
import { RosterStrip } from "@/components/trip/roster-strip";
import { TripSheet, draftFor, type TripDraft } from "@/components/trip/trip-sheet";
import { QuietAction } from "@/components/system/text-controls";
import { useTourTarget } from "@/components/tour/tour-context";
import { Body, Card, Failed, Label, Loading } from "@/components/system/ui";
import type { AppRouter } from "@floc/api/router";
import type { inferRouterOutputs } from "@trpc/server";

import { trpc } from "@/lib/api";
import { inviteUrl } from "@/lib/config";
import { useTripWrite } from "@/lib/trip/trip-write";
import { space } from "@/lib/theme";

type Outputs = inferRouterOutputs<AppRouter>;

/** Overview shows the top of the pile; the rest is a count, and the Files screen. */
const FILES_SHOWN = 3;

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
  const days = useQuery(trpc.itinerary.days.queryOptions({ tripId }, { enabled: ready }));
  const invites = useQuery(trpc.invites.forTrip.queryOptions({ tripId }, { enabled: ready }));
  const availability = useQuery(trpc.availability.list.queryOptions({ tripId }, { enabled: ready }));
  const rosterTarget = useTourTarget("roster");
  const [draft, setDraft] = useState<TripDraft | null>(null);

  if (trip.isPending) return <Loading />;
  if (trip.isError) return <Failed onRetry={() => trip.refetch()} />;

  const go = (route: string) => router.push(`/trip/${tripId}/${route}` as never);
  const openDay = (date: string) => router.push({ pathname: "/trip/[id]/days", params: { id: tripId, date } });
  const legs = legsFrom(days.data, files.data);
  const pinned = pinsFor(legs, places.data);

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.xl }}>
      <OverviewCard
        trip={trip.data}
        nights={days.data?.length ?? 0}
        spend={ledger.data ? spendHeadline(ledger.data.expenses) : null}
        onEdit={() => setDraft(draftFor(trip.data))}
        onDates={() => go("dates")}
        onGroup={() => go("roster")}
        onMoney={() => go("money")}
      />

      {pinned.length > 0 ? (
        <Card>
          <RouteMap places={pinned} />
        </Card>
      ) : null}

      {/* Ideas first while undated: before the dates exist it is the only live question here. */}
      <IdeasSection tripId={tripId} datesUnset={!trip.data.startDate && !trip.data.endDate} />

      <View ref={rosterTarget} style={{ gap: space.sm }}>
        <Label>Who&apos;s going</Label>
        <Card>
          <GroupActions
            link={invites.data ? inviteUrl(invites.data.token) : null}
            onInvite={() => router.push(`/trip/${tripId}/invite`)}
          />
          <RosterStrip people={trip.data.members} statuses={statusesFor(trip.data, availability.data)} />
        </Card>
      </View>

      <FilesSection files={files} />

      {legs.length > 0 ? (
        <View style={{ gap: space.sm }}>
          <Label>Legs</Label>
          <LegList legs={legs} onOpen={openDay} />
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

function legsFrom(days: Outputs["itinerary"]["days"] | undefined, files: Outputs["files"]["list"] | undefined) {
  return tripLegs({
    days: (days ?? []).map((d) => ({ dayId: d.id, date: d.date, overnightPlaceId: d.overnightPlaceId, placeName: d.overnightPlaceName })),
    modes: transportModes(days ?? []),
    files: files ?? [],
  }).legs;
}

// Pins in leg order, so pin 2 is leg 2 — the web's map does the same.
function pinsFor(legs: { placeId: number }[], places: Outputs["places"]["list"] | undefined) {
  if (!places) return [];
  return legs.length > 0 ? legs.flatMap((l) => places.filter((p) => p.id === l.placeId)) : places;
}

function FilesSection({
  files,
}: {
  files: { isPending: boolean; isError: boolean; data: Outputs["files"]["list"] | undefined; refetch: () => unknown };
}) {
  return (
    <View style={{ gap: space.sm }}>
      <Label>Files</Label>
      <Card>
        {files.isPending ? (
          <Loading />
        ) : files.isError ? (
          <Failed onRetry={() => files.refetch()} />
        ) : !files.data || files.data.length === 0 ? (
          <Body tone="ink-2">No tickets or bookings yet.</Body>
        ) : (
          <FileList files={files.data} showing={FILES_SHOWN} />
        )}
      </Card>
    </View>
  );
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
