import { TERMS_VERSION } from "@floc/core/legal/terms";

export function checkoutTerms(origin: string): { submitMessage: string; metadata: { termsVersion: string } } {
  return {
    submitMessage: `By subscribing you agree to the [Terms of use](${origin}/terms). Pro starts now. You can cancel within 14 days for a full refund.`,
    metadata: { termsVersion: TERMS_VERSION },
  };
}
