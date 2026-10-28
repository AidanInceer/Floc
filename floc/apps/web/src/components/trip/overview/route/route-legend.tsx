// Why: the dot's colour is not enough on its own, so each route is named and its age said in words (#329).
import type { GroupRoute } from "@floc/api/port";
import { positionAge } from "@floc/core/trip/route/route-track";
import { ConfirmSubmit } from "@/components/system/client-ui";

export function RouteLegend({
  routes,
  viewerId,
  now,
  deleteMine,
}: {
  routes: GroupRoute[];
  viewerId: string;
  now: number;
  deleteMine: () => Promise<void>;
}) {
  if (routes.length === 0) return null;
  const mine = routes.some((r) => r.userId === viewerId);
  return (
    <div className="flex flex-col gap-1 rounded-md bg-sheet px-3 py-2 text-xs shadow-sm ring-1 ring-rule">
      <ul className="flex flex-col gap-1">
        {routes.map((r) => (
          <li key={r.userId} className="flex items-center gap-2">
            <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: `var(--${r.tone}-ink)` }} />
            <span className="text-ink">{r.userId === viewerId ? "You" : r.name}</span>
            {r.live ? <span className="text-ink-soft">{positionAge(r.live.recordedAt, now)}</span> : null}
          </li>
        ))}
      </ul>
      {mine ? (
        <form action={deleteMine}>
          <ConfirmSubmit
            variant="ghost"
            confirmLabel="Delete my route"
            message="Delete your route on this trip? It goes for everyone, for good."
            className="-ml-1 px-1 py-0.5 text-xs text-ink-soft hover:text-red"
          >
            Delete my route
          </ConfirmSubmit>
        </form>
      ) : null}
    </div>
  );
}
