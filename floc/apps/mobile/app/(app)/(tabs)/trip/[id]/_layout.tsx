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
 * EDITING THE TRIP LIVES ON ITS CARD, NOT HERE. The name, colour, tags,
 * archive and delete were behind a pen beside the title on every section —
 * one rare job given a permanent control on seven screens. The trips list card
 * carries the same menu the web card does, so this header is the name and
 * nothing else (#302).
 *
 * SHARING IS NOT HERE EITHER. It sits on the group itself, on Overview, where
 * the web keeps it — one job, one door. A glyph up here was the second and the
 * less findable of the two.
 *
 * NOTHING HERE IS GATED (rule 4). Every route is reachable on any trip. Money
 * opens with no expenses, Days opens with no dates, and each says so itself.
 */
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";

import { useTheme } from "@/components/theme";
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

  // Somebody else deleted it, or you were kicked. The read fails and it is the
  // same failure as "never existed" (rule 5), so there is nothing to retry on:
  // out to the list, which is the truthful screen.
  useEffect(() => {
    if (trip.isError) router.replace("/trips");
  }, [trip.isError, router]);

  const name = trip.data?.name ?? "Trip";

  return (
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
          />
        ),
      }}
    />
  );
}
