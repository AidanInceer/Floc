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
 * RENAMING LIVES HERE. The name is in the header on every section, so the
 * header is where it is changed — tapping it opens a sheet. Overview used to
 * carry a labelled field for it, which meant the name was drawn twice and a
 * once-a-trip job took up room on every visit (#126, #302). The write is in
 * this file because only a route may reach the API.
 *
 * NOTHING HERE IS GATED (rule 4). Every route is reachable on any trip. Money
 * opens with no expenses, Days opens with no dates, and each says so itself.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Sheet } from "@/components/sheet";
import { useTheme } from "@/components/theme";
import { TripHeader, type Section } from "@/components/trip-header";
import { Body, Button, Field } from "@/components/ui";
import { space } from "@/lib/theme";
import { trpc } from "@/lib/api";
import { viewerBalance } from "@/lib/balance";
import { useSession } from "@/lib/auth";

/** Planning order: you land, talk it over, fix dates, fill days, settle, pack. */
const SECTIONS: Section[] = [
  { route: "", label: "Overview" },
  { route: "notes", label: "Notes" },
  { route: "dates", label: "Dates" },
  { route: "days", label: "Days" },
  { route: "money", label: "Money" },
  { route: "packing", label: "Packing" },
];

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
  const [draft, setDraft] = useState<string | null>(null);

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

  const rename = useMutation({
    ...trpc.trips.update.mutationOptions(),
    onSuccess: () => {
      setDraft(null);
      queryClient.invalidateQueries({ queryKey: trpc.trips.get.queryKey({ tripId }) });
    },
  });

  const name = trip.data?.name ?? "Trip";
  // A blank name is not a rename, and neither is the name it already has.
  const changed = draft !== null && draft.trim() !== "" && draft.trim() !== name;

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
            onEditName={() => setDraft(name)}
          />
        ),
      }}
    />

    <Sheet open={draft !== null} onClose={() => setDraft(null)}>
      <View style={{ padding: space.lg, gap: space.md }}>
        <Field label="Trip name" value={draft ?? ""} onChangeText={setDraft} autoFocus />
        {rename.isError ? <Body tone="red">{rename.error.message}</Body> : null}
        <Button
          label="Rename it"
          busy={rename.isPending}
          onPress={() => {
            if (!changed || draft === null) return;
            rename.mutate({ tripId, name: draft.trim() });
          }}
        />
      </View>
    </Sheet>
    </>
  );
}
