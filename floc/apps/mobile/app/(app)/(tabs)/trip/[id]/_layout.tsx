/**
 * One trip, one stack, one rail (tickets 299, 302).
 *
 * WHAT CHANGED AND WHY. This was five bottom tabs, then a hamburger and a
 * sheet. The sheet wrote down its own weak point — a drawer gets ignored — and
 * it was right, so the sections are now a rail of words in the trip's header
 * (see `trip-header`). Every one is visible and one tap away.
 *
 * SIX, NOT SEVEN. Who is coming is the first thing Overview shows, so a row
 * for it was saying twice what the page already said (#144). `roster` is still
 * a live route; it simply is not on the rail.
 *
 * THE BALANCE STILL HAS ITS OWN CHIP. Not as an escape hatch any more — Money
 * is on the rail like everything else — but because the figure is *status*,
 * which is the one thing text still carries when the drawing is clear.
 *
 * EDITING THE TRIP LIVES HERE. The name is in the header on every section, so
 * the header is where it is changed — tapping it opens a sheet. Overview used
 * to carry a labelled field for it, which meant the name was drawn twice and a
 * once-a-trip job took up room on every visit (#126, #302). Colour and tags
 * (#71, #213) joined that sheet rather than getting a screen each: all three
 * are the same rare job, and the web keeps them in one menu too. The write is
 * in this file because only a route may reach the API.
 *
 * ARCHIVING AND DELETING SHARE THAT SHEET. Same rare job, same rare place —
 * and the web keeps them in the same menu the rename is in. They sit under a
 * rule rather than beside the name: `TripDanger` owns the two-press guard, so
 * this file stays the one that talks to the API.
 *
 * NOTHING HERE IS GATED (rule 4). Every route is reachable on any trip. Money
 * opens with no expenses, Days opens with no dates, and each says so itself.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useState } from "react";

import { parseTagNames, readTags } from "@floc/core/tags";
import { readTripColor, type TripColor } from "@floc/core/trip-color";

import { Sheet } from "@/components/sheet";
import { useTheme } from "@/components/theme";
import { TripDanger } from "@/components/trip-danger";
import { TripEdit, rowsFromTags, type TagRow } from "@/components/trip-edit";
import { TripHeader, type Section } from "@/components/trip-header";
import { trpc } from "@/lib/api";
import { viewerBalance } from "@/lib/balance";
import { useSession } from "@/lib/auth";

/** Planning order: you land, talk it over, fix dates, fill days, settle, pack, file. */
const SECTIONS: Section[] = [
  { route: "", label: "Overview" },
  { route: "notes", label: "Notes" },
  { route: "dates", label: "Dates" },
  { route: "days", label: "Days" },
  { route: "money", label: "Money" },
  { route: "packing", label: "Packing" },
  { route: "files", label: "Files" },
];

/** Everything the sheet edits, held together so it cannot be half-open. */
type Draft = { name: string; color: TripColor | null; rows: TagRow[] };

/** The last path segment, which is the section — `""` for the trip's own index. */
function sectionOf(pathname: string, tripId: number): string {
  const tail = pathname.split(`/trip/${tripId}`)[1] ?? "";
  return tail.replace(/^\//, "");
}

export default function TripLayout() {
  const { c } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  // A screen keeps rendering for a frame while it leaves, and `id` is gone by
  // then: NaN goes down the wire as null and the server rightly refuses it.
  const ready = Number.isFinite(tripId);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  /** The draft while the sheet is open; null when it is shut. One state, so it cannot be half-open. */
  const [draft, setDraft] = useState<Draft | null>(null);

  const trip = useQuery(trpc.trips.get.queryOptions({ tripId }, { enabled: ready }));
  const ledger = useQuery(trpc.money.ledger.queryOptions({ tripId }, { enabled: ready }));

  const balance = viewerBalance(ledger.data, session?.user.id);
  // Only while the viewer is actually up or down. "settled" is the ordinary
  // state of a trip, and a chip that is present whenever nothing is wrong is a
  // chip nobody reads (#126). It appears when there is something to say.
  const spent = (ledger.data?.expenses.length ?? 0) > 0;

  // `replace`, not `navigate`: the rail's six are siblings, not a trail. Pushing
  // built a stack six deep, so Back walked backwards through sections instead of
  // leaving the trip — and every push re-mounted the screen, which is the flicker.
  const go = (route: string) => {
    router.replace(`/trip/${tripId}/${route}` as never);
  };

  const save = useMutation({
    ...trpc.trips.update.mutationOptions(),
    onSuccess: () => {
      setDraft(null);
      queryClient.invalidateQueries({ queryKey: trpc.trips.get.queryKey({ tripId }) });
      // The list draws the same colour and tags, so it is stale the moment
      // this lands — and a card that disagrees with the trip it opens is worse
      // than one that reloads.
      queryClient.invalidateQueries({ queryKey: trpc.trips.list.queryKey() });
    },
  });

  // Both leave the trip behind, so both land back on the list rather than on a
  // screen for something that is no longer in your trips.
  const leaveToList = () => {
    setDraft(null);
    queryClient.invalidateQueries({ queryKey: trpc.trips.list.queryKey() });
    router.replace("/trips");
  };

  const archive = useMutation({
    ...trpc.trips.setArchived.mutationOptions(),
    onSuccess: leaveToList,
  });
  const destroy = useMutation({
    ...trpc.trips.delete.mutationOptions(),
    onSuccess: leaveToList,
  });

  const name = trip.data?.name ?? "Trip";

  const openEdit = () => {
    setDraft({
      name,
      color: readTripColor(trip.data?.colorKey),
      rows: rowsFromTags(readTags(trip.data?.tags)),
    });
  };

  const submit = () => {
    // A blank name is not a rename; the field keeps whatever it had.
    if (draft === null || draft.name.trim() === "") return;
    save.mutate({
      tripId,
      name: draft.name.trim(),
      colorKey: draft.color,
      tags: parseTagNames(draft.rows.map((row) => row.name)),
    });
  };

  return (
    <>
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: c.paper },
        // A rail is not a journey. Sliding one section over another said a
        // level had been entered when none had; with the header identical
        // either side, the slide read as the whole page reloading.
        animation: "none",
        header: () => (
          <TripHeader
            title={name}
            sections={SECTIONS}
            current={sectionOf(pathname, tripId)}
            balance={spent && balance.minor !== 0 ? balance.figure : null}
            owing={balance.minor < 0}
            onGo={go}
            onEditName={openEdit}
          />
        ),
      }}
    />

    <Sheet open={draft !== null} onClose={() => setDraft(null)}>
      {draft !== null ? (
        <TripEdit
          name={draft.name}
          onChangeName={(next) => setDraft({ ...draft, name: next })}
          color={draft.color}
          onChangeColor={(next) => setDraft({ ...draft, color: next })}
          rows={draft.rows}
          onChangeRows={(rows) => setDraft({ ...draft, rows })}
          busy={save.isPending}
          error={save.isError ? save.error.message : null}
          onSave={submit}
        />
      ) : null}
      {draft !== null && trip.data ? (
        <TripDanger
          isAdmin={trip.data.role === "admin"}
          archived={trip.data.archived}
          busy={archive.isPending || destroy.isPending}
          onArchive={(next) => archive.mutate({ tripId, archived: next })}
          onDelete={() => destroy.mutate({ tripId })}
        />
      ) : null}
    </Sheet>
    </>
  );
}
