import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";

import { useTheme } from "@/components/system/theme";
import { TripHeader, type Section } from "@/components/trip/trip-header";
import { useTripLive } from "@/components/trip/use-trip-live";
import { WelcomeGate } from "@/components/onboarding/welcome-sheet";
import { trpc } from "@/lib/api";
import { viewerBalance } from "@/lib/balance";
import { useSession } from "@/lib/auth";

const SECTIONS: Section[] = [
  { route: "", label: "Overview" },
  { route: "dates", label: "Dates" },
  { route: "days", label: "Days" },
  { route: "money", label: "Money" },
  { route: "packing", label: "Packing" },
  { route: "notes", label: "Notes" },
  { route: "files", label: "Files" },
];

function sectionOf(pathname: string, tripId: number): string {
  const tail = pathname.split(`/trip/${tripId}`)[1] ?? "";
  return tail.replace(/^\//, "");
}

function railOf(section: string): string {
  return section === "roster" || section === "invite" ? "" : section;
}

export default function TripLayout() {
  const { c } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  const ready = Number.isFinite(tripId);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const trip = useQuery(trpc.trips.get.queryOptions({ tripId }, { enabled: ready }));
  useTripLive(tripId, ready);
  const ledger = useQuery(trpc.money.ledger.queryOptions({ tripId }, { enabled: ready }));

  const pairs = useQuery(trpc.money.pairs.queryOptions({ tripId }, { enabled: ready }));

  const balance = viewerBalance(pairs.data?.rows, session?.user.id);
  const spent = (ledger.data?.expenses.length ?? 0) > 0;

  const go = (route: string) => {
    router.replace(`/trip/${tripId}/${route}` as never);
  };

  useEffect(() => {
    if (trip.isError) router.replace("/trips");
  }, [trip.isError, router]);

  const name = trip.data?.name ?? "Trip";
  const onOverview = sectionOf(pathname, tripId) === "";

  return (
    <>
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: c.paper },
        animation: "none",
        header: () => (
          <TripHeader
            title={name}
            sections={SECTIONS}
            current={railOf(sectionOf(pathname, tripId))}
            balance={spent && !balance.settled && !onOverview ? balance.figure : null}
            owing={balance.owing}
            onGo={go}
          />
        ),
      }}
    />
      {trip.data && onOverview ? (
        <WelcomeGate invited={trip.data.role === "member" ? name : null} />
      ) : null}
    </>
  );
}
