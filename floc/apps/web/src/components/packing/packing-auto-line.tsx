import Link from "next/link";

import { SparkIcon } from "@/components/packing/packing-glyphs";
import { SubmitButton } from "@/components/system/client-ui";
import { cx } from "@/components/system/ui";
import { ideasWhy, type IdeasPlan } from "@floc/core/packing/packing-ideas";
import { PACK_TIERS, PACK_TIER_LABELS, type PackTier } from "@floc/core/packing/packing";

const linkClass = "whitespace-nowrap text-sm text-ink-soft underline decoration-rule-strong underline-offset-4 hover:text-ink";

function Why({ plan, tripId }: { plan: IdeasPlan; tripId: number }) {
  const why = ideasWhy(plan);
  if (!why.link) return <>{why.text}</>;
  return (
    <>
      {why.text}{" "}
      <Link href={`/trip/${tripId}/${why.link.to}`} className="text-ink underline underline-offset-2">{why.link.label}</Link>{" "}
      {why.link.after}
    </>
  );
}

/** "Remove suggested" (#469). Free too: a member whose Pro lapsed can still undo what it added. */
export function RemoveSuggested({ count, action }: { count: number; action: () => Promise<void> }) {
  if (count === 0) return null;
  return (
    <form action={action}>
      <button type="submit" className={linkClass}>
        Remove suggested <span className="nums text-[11px] text-ink-faint">{count}</span>
      </button>
    </form>
  );
}

/** The tier as a quiet track: plain words, the chosen one lifted onto the sheet. */
function TierTrack({ tier, setTier }: { tier: PackTier; setTier: (formData: FormData) => Promise<void> }) {
  return (
    <form action={setTier} className="inline-flex gap-0.5 rounded-full bg-sheet-3 p-[3px]" aria-label="How you pack">
      {PACK_TIERS.map((t) => (
        <button
          key={t}
          type="submit"
          name="packTier"
          value={t}
          aria-pressed={t === tier}
          className={cx(
            "rounded-full px-3 py-[3px] text-[12.5px] transition-colors",
            t === tier ? "bg-sheet text-ink shadow-sm" : "text-ink-soft hover:text-ink",
          )}
        >
          {PACK_TIER_LABELS[t]}
        </button>
      ))}
    </form>
  );
}

/**
 * Auto packing on one quiet line above the cubes (#469, prototype A): why the
 * ideas are what they are, how much you pack, and the bulk presses. The ideas
 * themselves sit in the cubes.
 */
export function PackingAutoLine({
  tripId,
  plan,
  tier,
  ideaCount,
  hidden,
  toggleHref,
  actions,
  removeSuggested,
}: {
  tripId: number;
  plan: IdeasPlan;
  tier: PackTier;
  ideaCount: number;
  hidden: boolean;
  toggleHref: string;
  actions: { setTier: (formData: FormData) => Promise<void>; addAll: () => Promise<void> };
  removeSuggested: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
      <p className="flex min-w-0 flex-[1_1_18rem] items-baseline gap-2 text-[13.5px] text-ink-soft">
        <SparkIcon className="self-center text-pen" />
        <span><Why plan={plan} tripId={tripId} /></span>
      </p>
      <TierTrack tier={tier} setTier={actions.setTier} />
      <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {ideaCount > 0 && !hidden ? (
          <form action={actions.addAll}>
            <SubmitButton variant="secondary" pendingLabel="Adding…" className="!px-3 !py-1">
              Add all {ideaCount}
            </SubmitButton>
          </form>
        ) : null}
        {ideaCount > 0 ? (
          <Link href={toggleHref} scroll={false} className={linkClass}>
            {hidden ? `Show ${ideaCount} ideas` : "Hide ideas"}
          </Link>
        ) : null}
        {removeSuggested}
      </span>
    </div>
  );
}

/** Free (#469, Aidan): no ideas and no tier, one line and the way to Pro. */
export function PackingUpgradeLine({ removeSuggested }: { removeSuggested: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-rule bg-sheet py-2.5 pl-3.5 pr-3">
      <SparkIcon className="text-ink-faint" />
      <p className="min-w-0 flex-[1_1_16rem] text-[13.5px] text-ink-soft">
        Auto packing fills your bag from the trip’s nights and weather.
      </p>
      {removeSuggested}
      <Link
        href="/settings?section=billing"
        className="rounded-full border border-rule-strong bg-sheet px-3 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-soft hover:border-pen hover:text-ink"
      >
        Upgrade to Pro
      </Link>
    </div>
  );
}
