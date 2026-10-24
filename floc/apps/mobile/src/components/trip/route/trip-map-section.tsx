// Why: the Overview's map, with each member's route over the planned stops and, while the trip runs, the switch (#329).
import type { ItineraryDay, TripFile } from "@floc/api/port";
import { todayPlan } from "@floc/core/trip/route/today-plan";
import { POSITION_EVERY_MS, underway } from "@floc/core/trip/route/route-track";
import { useQuery } from "@tanstack/react-query";

import { RouteMap, type MappablePlace } from "@/components/map/route-map";
import { Card } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { localDay } from "@/lib/route/route-queue";

import { RouteCard } from "./route-card";
import { RouteLegend } from "./route-legend";
import { TodayCard } from "./today-card";

type Trip = { id: number; startDate: string | null; endDate: string | null };

export function TodaySection({
  trip,
  days,
  files,
  onOpenDay,
}: {
  trip: Trip;
  days: ItineraryDay[] | undefined;
  files: TripFile[] | undefined;
  onOpenDay: (date: string) => void;
}) {
  const plan = todayPlan({ trip, days: days ?? [], files: files ?? [], today: localDay(new Date()) });
  return plan ? <TodayCard plan={plan} onOpenDay={() => onOpenDay(plan.date)} /> : null;
}

export function TripMapSection({ trip, pinned }: { trip: Trip; pinned: MappablePlace[] }) {
  const today = localDay(new Date());
  const live = underway(trip, today);
  const { data: session } = useSession();
  const routes = useQuery(
    trpc.route.group.queryOptions({ tripId: trip.id, today }, { refetchInterval: live ? POSITION_EVERY_MS : false }),
  );
  const tracks = routes.data ?? [];
  const mine = tracks.some((t) => t.userId === session?.user.id);

  return (
    <>
      {pinned.length > 0 ? (
        <Card>
          <RouteMap
            places={pinned}
            tracks={tracks}
            legend={<RouteLegend routes={tracks} viewerId={session?.user.id} now={routes.dataUpdatedAt || Date.now()} />}
          />
        </Card>
      ) : null}
      {live && trip.endDate ? <RouteCard tripId={trip.id} endDate={trip.endDate} hasRoute={mine} /> : null}
    </>
  );
}
