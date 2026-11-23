import type { Subscription } from "@/db/schema";
import { BillingAction } from "@/components/auth/billing-buttons";
import { billingHome } from "@floc/core/billing/billing-home";
import { renewalLabel } from "@floc/core/billing/subscription-copy";

const STORE_NAMES: Partial<Record<string, string>> = {
  app_store: "the App Store",
  play: "Google Play",
};

export function ProStatus({ subscription }: { subscription: Subscription }) {
  const store = STORE_NAMES[subscription.source];
  const billedOnWeb = billingHome(subscription.source) === "web";
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-sm text-ink-soft">
        <b className="font-semibold text-ink">You&rsquo;re on Floc Pro.</b> {renewalLabel(subscription)}
      </p>
      <p className="text-xs text-ink-faint">
        {store
          ? `Bought in ${store}, so it is managed or cancelled there.`
          : billedOnWeb
            ? "It adds extras to your own screen. The trip stays free for everyone on it."
            : "This one was granted rather than bought, so there is nothing to bill or cancel."}
      </p>
      {billedOnWeb ? (
        <div>
          <BillingAction path="/api/billing/portal">Manage or cancel</BillingAction>
        </div>
      ) : null}
    </div>
  );
}
