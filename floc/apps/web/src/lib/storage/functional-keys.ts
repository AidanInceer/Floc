/**
 * Everything Floc remembers on a device without being asked to (#368). Written only with a yes to
 * "Remember my choices", and removed when the answer changes to no. A new key goes in this list.
 */
export const FUNCTIONAL_KEYS = ["floc:ideas-sort"] as const;

/** Keys that start with one of these, for storage with one entry a thing: folded headings on each notes page (#408). */
export const FUNCTIONAL_PREFIXES = ["floc-folds:"] as const;

export type FunctionalKey = (typeof FUNCTIONAL_KEYS)[number];
