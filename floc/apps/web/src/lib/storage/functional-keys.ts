export const FUNCTIONAL_KEYS = ["floc:ideas-sort"] as const;

export const FUNCTIONAL_PREFIXES = ["floc-folds:"] as const;

export type FunctionalKey = (typeof FUNCTIONAL_KEYS)[number];
