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
 * NOTHING HERE IS GATED (rule 4). Every route is reachable on any trip. Money
 * opens with no expenses, Days opens with no dates, and each says so itself.
 */
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, usePathname, useRouter } from "expo-router";

import { useTheme } from "@/components/theme";
import { TripHeader, type Section } from "@/components/trip-header";
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

  const trip = useQuery(trpc.trips.get.queryOptions({ tripId }, { enabled: ready }));
  const ledger = useQuery(trpc.money.ledger.queryOptions({ tripId }, { enabled: ready }));

  const balance = viewerBalance(ledger.data, session?.user.id);

  const go = (route: string) => {
    router.navigate(`/trip/${tripId}/${route}` as never);
  };

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: c.paper },
        header: () => (
          <TripHeader
            title={trip.data?.name ?? "Trip"}
            sections={SECTIONS}
            current={sectionOf(pathname, tripId)}
            balance={balance.figure}
            owing={balance.minor < 0}
            onGo={go}
          />
        ),
      }}
    />
  );
}
