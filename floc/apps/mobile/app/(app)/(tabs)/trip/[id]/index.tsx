/**
 * Trip Overview (tickets 291, 296).
 *
 * A TRIP HAS TWO FACES. Days is its *when*. This is its *who, where and what*:
 * people, places, files, and anything outstanding. That line already exists in
 * the data — days come from `day` rows, while members, places and files belong
 * to no particular date.
 *
 * So a trip with no dates opens here not because it is blocked, but because
 * this is the half that still has something to show. Nothing is gated, no flag
 * is stored, and undated is never an error (rules 4 and 9).
 *
 * EVERYTHING ON THIS SCREEN IS DERIVED. The outstanding items especially:
 * there is no notification table and no dismiss, so an item is present exactly
 * while the fact behind it is true. The stops likewise — consecutive days
 * sharing an overnight place, computed by `@floc/core/stops`, never a `stop`
 * table (rule 3).
 */
import { computeBalances, isAllSettled } from "@floc/core/money";
import { formatDateRange } from "@floc/core/dates";
import { readTripColor } from "@floc/core/trip-color";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, View } from "react-native";

import { FileList } from "@/components/file-list";
import { NeedsYou, type Outstanding } from "@/components/needs-you";
import { PlacePlot } from "@/components/place-plot";
import { RosterStrip } from "@/components/roster-strip";
import { TagPills } from "@/components/tag-pills";
import {
  Body,
  Card,
  Failed,
  Figure,
  Label,
  Loading,
  Pill,
} from "@/components/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

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

  if (trip.isPending) return <Loading />;
  if (trip.isError) return <Failed onRetry={() => trip.refetch()} />;

  const outstanding: Outstanding[] = [];

  // No dates is the normal starting state of a trip, so this is an invitation,
  // never a warning (rule 9).
  if (!trip.data.startDate) {
    outstanding.push({
      id: "dates",
      said: "No dates set yet.",
      action: "Set them",
      onPress: () => router.push(`/trip/${tripId}/dates`),
    });
  }

  // Derived from the ledger the API already returned — there is no balance
  // column and no balance procedure, because a stored balance is a second
  // source of truth about the same money (rule 1).
  if (ledger.data) {
    const balances = computeBalances(
      ledger.data.expenses.map((expense) => ({
        paidBy: expense.paidBy,
        currency: expense.currency,
        amountMinor: expense.amountMinor,
        splits: ledger.data.splits
          .filter((split) => split.expenseId === expense.id)
          .map((split) => ({ userId: split.userId, owedAmountMinor: split.owedAmountMinor })),
      })),
      ledger.data.settlements.map((settlement) => ({
        from: settlement.fromUserId,
        to: settlement.toUserId,
        currency: settlement.currency,
        amountMinor: settlement.amountMinor,
      })),
    );
    if (!isAllSettled(balances)) {
      outstanding.push({
        id: "money",
        said: "Money is not settled up.",
        action: "See who owes what",
        onPress: () => router.push(`/trip/${tripId}/money`),
      });
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.xl }}>
      {/* No name here: the header carries it on every section, and printing it
          again on one of the six said the same word twice for no reason. */}
      <View style={{ gap: space.xs }}>
        <Figure tone="ink-2">{formatDateRange(trip.data.startDate, trip.data.endDate)}</Figure>
        {/* Tags sit under the dates, as they do on the web's hero row. There
            is no "add a tag" here — the header's sheet owns every edit to the
            trip itself, so this is the reading half only (#71, #213). */}
        <TagPills
          tags={trip.data.tags}
          color={readTripColor(trip.data.colorKey)}
          tripId={tripId}
        />
        {trip.data.archived ? <Pill word="Archived" tone="butter" /> : null}
      </View>

      <NeedsYou items={outstanding} />

      <View style={{ gap: space.sm }}>
        <Label>Who is coming</Label>
        <Card>
          <RosterStrip people={trip.data.members} />
        </Card>
      </View>

      <View style={{ gap: space.sm }}>
        <Label>Where</Label>
        <Card>
          {places.isPending ? (
            <Loading />
          ) : places.isError ? (
            <Failed onRetry={() => places.refetch()} />
          ) : places.data.length === 0 ? (
            <Body tone="ink-2">Nowhere on the map yet.</Body>
          ) : (
            <PlacePlot places={places.data} />
          )}
        </Card>
      </View>

      <View style={{ gap: space.sm }}>
        <Label>Files</Label>
        <Card>
          {files.isPending ? (
            <Loading />
          ) : files.isError ? (
            <Failed onRetry={() => files.refetch()} />
          ) : files.data.length === 0 ? (
            <Body tone="ink-2">No files yet.</Body>
          ) : (
            <FileList files={files.data} showing={FILES_SHOWN} />
          )}
        </Card>
      </View>
    </ScrollView>
  );
}
