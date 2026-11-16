import { shouldStartWalkthrough } from "@floc/core/trip/walkthrough";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { useTheme } from "@/components/system/theme";
import { TripHeader, type Section } from "@/components/trip/trip-header";
import { useTripLive } from "@/components/trip/use-trip-live";
import { WalkthroughSheet } from "@/components/walkthrough/walkthrough-sheet";
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
        <FirstTripWalkthrough
          tripId={tripId}
          tripName={name}
          datesSet={trip.data.startDate !== null}
          joined={trip.data.role === "member"}
          firstName={session?.user.name.split(" ")[0] ?? ""}
          onDates={() => go("dates")}
        />
      ) : null}
    </>
  );
}

function FirstTripWalkthrough({ tripId, tripName, datesSet, joined, firstName, onDates }: {
  tripId: number;
  tripName: string;
  datesSet: boolean;
  joined: boolean;
  firstName: string;
  onDates: () => void;
}) {
  const queryClient = useQueryClient();
  const seen = useQuery(trpc.me.tourSeen.queryOptions());
  const live = useQuery(trpc.trips.list.queryOptions({ archived: false }));
  const archived = useQuery(trpc.trips.list.queryOptions({ archived: true }));
  const places = useQuery(trpc.places.list.queryOptions({ tripId }));
  const mark = useMutation({
    ...trpc.me.markTourSeen.mutationOptions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.me.tourSeen.queryKey() }),
  });
  const [closed, setClosed] = useState(false);

  if (seen.data === undefined || !live.data || !archived.data || !places.data || closed) return null;
  if (!shouldStartWalkthrough({ seen: seen.data, tripCount: live.data.length + archived.data.length })) return null;
  const close = () => {
    setClosed(true);
    mark.mutate();
  };
  return (
    <WalkthroughSheet
      trip={{ name: tripName, joined, datesSet, placesSet: places.data.length > 0 }}
      firstName={firstName}
      onClose={close}
      onGo={(step) => {
        close();
        if (step.key === "dates") onDates();
      }}
    />
  );
}
