/** The Floc Pro row for someone already on Pro: the date, and the one way out that fits how they got it (ticket 247). */
import type { Subscription } from "@/db/schema";
import { BillingAction } from "@/components/auth/billing-buttons";
import { renewalLabel } from "@floc/core/billing/subscription-copy";

/** Apple and Google will not let anyone but themselves cancel a store subscription. */
const STORE_NAMES: Partial<Record<string, string>> = {
  app_store: "the App Store",
  play: "Google Play",
};

export function ProStatus({ subscription }: { subscription: Subscription }) {
  const store = STORE_NAMES[subscription.source];
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-sm text-ink-soft">
        <b className="font-semibold text-ink">You&rsquo;re on Floc Pro.</b> {renewalLabel(subscription)}
      </p>
      <p className="text-xs text-ink-faint">
        {store
          ? `Bought in ${store}, so it is managed or cancelled there.`
          : subscription.stripeCustomerId
            ? "It covers everyone on your trips."
            : "This one was granted rather than bought, so there is nothing to bill or cancel."}
      </p>
      {!store && subscription.stripeCustomerId ? (
        <div>
          <BillingAction path="/api/billing/portal">Manage or cancel</BillingAction>
        </div>
      ) : null}
    </div>
  );
}
