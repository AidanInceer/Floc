/** The facts the legal pages, the feedback form and the terms record all state, kept in one place (#271, #549). */

export const CONTACT_EMAIL = "hello@floc.live";

/** The person you make a contract with when you use Floc (ADR-058: a sole trader, not a company). */
export const CONTRACTING_PARTY = "Aidan Inceer, trading as Floc";

/**
 * Why (#549): UK distance-selling rules need a postal address before Floc takes payment, and a sole trader's
 * address is often a home. It lives in the server's settings (FLOC_POSTAL_ADDRESS), not in the code.
 */
export function postalAddress(): string | null {
  return process.env.FLOC_POSTAL_ADDRESS?.trim() || null;
}

export const ADDRESS_GAP = "A postal address will be shown here before Floc takes any payment.";

/** Railway runs floc-web in europe-west4 (the Netherlands); the Turso database is in aws-eu-west-1 (Ireland). */
export const DATA_LOCATION =
  "Floc's website and files are in the Netherlands, and its database is in Ireland. Email, payment, notifications and sign-in with Google can hold data in the United States. When data leaves the UK and the EU, we rely on the UK's data bridge with the United States or on the contract terms the UK approves for this.";
