import { TERMS_VERSION } from "@floc/core/legal/terms";

/**
 * Why (#549): UK law gives 14 days to cancel a distance purchase, and a service may start inside those days only
 * when the buyer asks. The line sits above Stripe's pay button, and the terms version rides on the subscription
 * as the record of what the buyer saw. Floc keeps the right to cancel in place and refunds in full.
 */
export function checkoutTerms(origin: string): { submitMessage: string; metadata: { termsVersion: string } } {
  return {
    submitMessage: `By subscribing you agree to the [Terms of use](${origin}/terms). Pro starts now. You can cancel within 14 days for a full refund.`,
    metadata: { termsVersion: TERMS_VERSION },
  };
}
