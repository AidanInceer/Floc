/** The facts the legal pages, the feedback form and the terms record all state, kept in one place (#271, #549). */

export const CONTACT_EMAIL = "hello@floc.live";

/** The person you make a contract with when you use Floc (ADR-058: a sole trader, not a company). */
export const CONTRACTING_PARTY = "Aidan Inceer, trading as Floc";

/**
 * Not known yet, so the pages say so and do not guess. Fill both before Floc takes real payment (#551):
 * UK distance-selling rules need a postal address, and the privacy policy must say where data is held.
 */
export const POSTAL_ADDRESS: string | null = null;
export const DATA_LOCATION: string | null = null;

export const ADDRESS_GAP = "A postal address will be shown here before Floc takes any payment.";
export const LOCATION_GAP = "The countries where these companies hold Floc's data will be listed here before Floc takes any payment.";
